// background.js – now with download status logging

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "download") {
    console.log("[Background] Received download request:");
    console.log("    URL:", msg.url);
    console.log("    Filename:", msg.filename);
    console.log("    From tab:", sender.tab?.url || "unknown");

    chrome.downloads.download({
      url: msg.url,
      filename: msg.filename,
      saveAs: false,
      conflictAction: "uniquify"
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("[Background] Download FAILED:", chrome.runtime.lastError.message);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        console.log(`[Background] Download STARTED – ID: ${downloadId} for ${msg.filename}`);
        // Optional: listen for final status
        chrome.downloads.onChanged.addListener(function handler(delta) {
          if (delta.id === downloadId && delta.state) {
            console.log(`[Background] Download ${delta.state.current} – ${msg.filename}`);
            if (delta.state.current === "interrupted" || delta.state.current === "complete") {
              chrome.downloads.onChanged.removeListener(handler);
            }
          }
        });
        sendResponse({ success: true, downloadId });
      }
    });

    return true; // keep message channel open for async response
  }
});