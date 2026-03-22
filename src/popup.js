const startBtn = document.getElementById('start');
const stopBtn  = document.getElementById('stop');
const prefixInput = document.getElementById('prefix');
const statusEl = document.getElementById('status');
const counterEl = document.getElementById('counter');

let isSaving = false;

function updateUI(savedCount = 0, isActive = false, isFinished = false) {
  if (isFinished) {
    statusEl.textContent = "Session finished";
    statusEl.className = "finished";
  } else if (isActive) {
    statusEl.textContent = "Saving in progress...";
    statusEl.className = "active";
  } else {
    statusEl.textContent = "No session active";
    statusEl.className = "inactive";
  }

  counterEl.textContent = `Saved: ${savedCount}`;
}

startBtn.onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const prefix = prefixInput.value.trim();

  await chrome.tabs.sendMessage(tab.id, {
    action: "start",
    prefix: prefix
  });

  isSaving = true;
  updateUI(0, true, false);
};

stopBtn.onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  await chrome.tabs.sendMessage(tab.id, { action: "stop" });
  isSaving = false;
  updateUI(0, false, true);
  setTimeout(() => updateUI(0, false, false), 3000);
};

// Listen for real-time counter updates
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "updateCounter") {
    updateUI(msg.saved, !msg.stopped, msg.stopped);
  }
});

// Initialize UI
updateUI(0, false, false);