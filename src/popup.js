const startBtn = document.getElementById('start');
const stopBtn  = document.getElementById('stop');
const status   = document.getElementById('status');

let isSaving = false;

startBtn.onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.tabs.sendMessage(tab.id, { action: "start" });
  isSaving = true;
  status.textContent = "✅ Saving in progress...";
  status.style.color = "lime";
};

stopBtn.onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.tabs.sendMessage(tab.id, { action: "stop" });
  isSaving = false;
  status.textContent = "🛑 Stopped";
  status.style.color = "white";
};