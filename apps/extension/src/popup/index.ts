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

// Open the desktop app's dashboard. FR-09: the Tauri app exposes no web
// dashboard reachable from a browser tab (localhost:1420 is only the dev
// server's devUrl). The real way to "open the dashboard" is to launch the
// native app itself, so we reuse the open_app native messaging path instead of
// opening a browser tab to a hardcoded dev URL.
openDashboardBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "open_app" });
});

// Check connection on popup open
checkConnection();
