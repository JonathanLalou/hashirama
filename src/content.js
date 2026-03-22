// content.js – with FIXED prefix support

let isSaving = false;
let counter = 1;
const downloaded = new Set();
let scrollInterval = null;
let savedHttp = 0;
let savedBlob = 0;
let totalImagesDetected = 0;
let currentPrefix = '';  // ← this will hold the prefix from popup

// Helpers
function pad(num) {
  return String(num).padStart(4, '0');
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"\/\\|?*]/g, '_');
}

// Download logic – now uses currentPrefix if set
async function downloadImage(src) {
  if (downloaded.has(src)) {
    console.log(`[ImageSaver] Skip (already): ${src.slice(0,80)}...`);
    return;
  }
  downloaded.add(src);

  const isBlob = src.startsWith('blob:');
  if (isBlob) savedBlob++;
  else savedHttp++;

  let downloadUrl = src;
  let ext = 'webp';

  if (isBlob) {
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`Blob fetch failed: ${response.status}`);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      downloadUrl = `data:${blob.type || 'image/webp'};base64,${base64}`;
      console.log(`[ImageSaver] Blob → data: URL (base64 length: ${base64.length})`);
    } catch (err) {
      console.error(`[ImageSaver] Blob conversion failed:`, err);
      return;
    }
  }

  // Use prefix if set (from popup message)
  const prefixPart = currentPrefix ? `${sanitizeFilename(currentPrefix)}_` : '';
  const filename = sanitizeFilename(`${prefixPart}${pad(counter)}.${ext}`);

  console.log(`[ImageSaver] QUEUING: ${filename} from ${downloadUrl.slice(0,60)}...`);

  chrome.runtime.sendMessage({
    action: "download",
    url: downloadUrl,
    filename: filename
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(`[ImageSaver] Message failed: ${chrome.runtime.lastError.message}`);
    } else if (response?.error) {
      console.error(`[ImageSaver] Download error: ${response.error}`);
    } else {
      console.log(`[ImageSaver] Queued OK → ${filename}`);
    }
  });

  counter++;

  chrome.runtime.sendMessage({
    action: "updateCounter",
    saved: downloaded.size,
    total: totalImagesDetected || counter - 1
  });
}

// Fetch interceptor (unchanged)
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);

  if (isSaving && typeof args[0] === 'string' && args[0].includes('/get-image?data=')) {
    console.log(`[ImageSaver] ★ Caught real fetch: ${args[0].slice(0,80)}...`);

    try {
      const blob = await response.clone().blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const dataUrl = `data:${blob.type || 'image/webp'};base64,${base64}`;
      const prefixPart = currentPrefix ? `${sanitizeFilename(currentPrefix)}_` : '';
      const filename = `${prefixPart}${pad(counter)}.webp`;

      chrome.runtime.sendMessage({
        action: "download",
        url: dataUrl,
        filename: filename
      });

      downloaded.add(args[0]);
      counter++;
      savedHttp++;

      console.log(`[ImageSaver] Saved via fetch intercept → ${filename}`);
    } catch (err) {
      console.error(`[ImageSaver] Fetch intercept error:`, err);
    }
  }

  return response;
};

// Scanning & monitoring (unchanged)
function scanAllImages() {
  document.querySelectorAll('img').forEach(img => {
    if (img.src) downloadImage(img.src);
  });
}

function startMonitoring() {
  console.log("[ImageSaver] Monitoring STARTED");
  isSaving = true;
  counter = 1;
  downloaded.clear();
  savedHttp = 0;
  savedBlob = 0;
  totalImagesDetected = 0;

  const observer = new MutationObserver(scanAllImages);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

  document.addEventListener('load', e => {
    if (e.target.tagName === 'IMG' && e.target.src) scanAllImages();
  }, true);

  setInterval(scanAllImages, 400);

  scanAllImages();
  setTimeout(scanAllImages, 200);
  setTimeout(scanAllImages, 600);

  scrollInterval = setInterval(() => {
    if (!isSaving) return;
    window.scrollBy(0, window.innerHeight * 0.9);
    scanAllImages();
  }, 700);
}

function stopMonitoring() {
  console.log("[ImageSaver] Monitoring STOPPED");
  isSaving = false;
  if (scrollInterval) clearInterval(scrollInterval);

  console.log(
    `%c[ImageSaver] FINISHED — Attempts: ${downloaded.size}  (HTTP/fetch: ${savedHttp} | BLOB: ${savedBlob})`,
    "color:#0f0; font-weight:bold; font-size:1.2em;"
  );

  chrome.runtime.sendMessage({
    action: "updateCounter",
    saved: downloaded.size,
    total: totalImagesDetected || downloaded.size,
    stopped: true
  });
}

// Message listener – now properly stores prefix
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "start") {
    currentPrefix = msg.prefix || '';  // store the prefix sent from popup
    console.log(`[ImageSaver] Session started with prefix: "${currentPrefix}"`);
    startMonitoring();
  }
  if (msg.action === "stop") {
    stopMonitoring();
  }
});

// Initial scan (runs on every page load)
scanAllImages();
