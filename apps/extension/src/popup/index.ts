// Social-Pip Extension Popup
// Minimal popup to show connection status and open the desktop app

const statusEl = document.getElementById("status") as HTMLDivElement;
const openAppBtn = document.getElementById("open-app") as HTMLButtonElement;
const openDashboardBtn = document.getElementById("open-dashboard") as HTMLButtonElement;

// Check native messaging connection
async function checkConnection(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: "ping" });
    if (response?.success) {
      statusEl.textContent = "✓ Conectado a Social-Pip Desktop";
      statusEl.className = "status connected";
    } else {
      statusEl.textContent = "✗ Desktop app no detectada";
      statusEl.className = "status disconnected";
    }
  } catch {
    statusEl.textContent = "✗ Desktop app no detectada";
    statusEl.className = "status disconnected";
  }
}

// Open the desktop app
openAppBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "open_app" });
});

// Open dashboard in browser
openDashboardBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:1420" });
});

// Check connection on popup open
checkConnection();
