# Social-Pip Native Messaging Configuration

This directory contains the configuration files for Chrome Native Messaging, which enables the Chrome extension to communicate with the Tauri desktop application.

## What is Native Messaging?

Chrome extensions use Native Messaging to communicate with native applications (like our Tauri app) via JSON messages over stdin/stdout. This allows the extension to:
- Query anti-ban status before posting
- Get delay calculations
- Record posting actions
- Receive task results

## Architecture

```
┌─────────────────┐     Native Messaging      ┌─────────────────┐
│  Chrome         │  ──────────────────────►  │  Tauri Desktop  │
│  Extension      │  ◄──────────────────────  │  App            │
│  (Service       │     JSON over stdin/      │  (Rust backend) │
│   Worker)       │     stdout                │                 │
└─────────────────┘                           └─────────────────┘
        │                                              │
        │                                              │
        ▼                                              ▼
┌─────────────────┐                           ┌─────────────────┐
│  Content        │                           │  Anti-Ban       │
│  Scripts        │                           │  Engine         │
│  (Platform      │                           │  (Rate Limiting)│
│   Automation)   │                           │                 │
└─────────────────┘                           └─────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `com.social_pip.app.json` | Native Messaging Host manifest (Chrome configuration) |
| `install-native-messaging.reg` | Windows Registry file for manual installation |
| `install.bat` | Batch script for automatic installation |
| `install.ps1` | PowerShell script for installation (recommended) |
| `README.md` | This documentation |

## Quick Start

### Prerequisites

1. **Build the Tauri app**:
   ```bash
   pnpm build:desktop
   ```
   The executable will be at: `apps/desktop/src-tauri/target/release/social-pip.exe`

2. **Load the Chrome extension**:
   - Open `chrome://extensions`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `apps/extension/dist` folder (after `pnpm build:extension`)
   - Note the extension ID shown (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### Installation

#### Option 1: PowerShell (Recommended)

```powershell
# From apps/desktop/native-messaging directory:
.\install.ps1 -ExtensionId "YOUR_EXTENSION_ID" -ExecutablePath "E:\social-pip\apps\desktop\src-tauri\target\release\social-pip.exe"
```

#### Option 2: Batch Script

```cmd
# Edit com.social_pip.app.json first, then run:
install.bat
```

#### Option 3: Manual Registry Import

1. Edit `com.social_pip.app.json`:
   - Replace `EXTENSION_ID` with your actual extension ID
   - Replace `PLACEHOLDER_PATH_TO_EXECUTABLE` with the full path to `social-pip.exe`

2. Double-click `install-native-messaging.reg` or run:
   ```cmd
   reg import install-native-messaging.reg
   ```

### Post-Installation

1. **Restart Chrome** completely (close all windows)

2. **Verify installation**:
   - Open `chrome://version`
   - Check that native messaging is enabled

3. **Test the connection**:
   - Open the extension popup
   - Check the background script console in `chrome://extensions`
   - Look for "Native messaging connected" messages

## Native Messaging Host Manifest

The manifest file (`com.social_pip.app.json`) contains:

```json
{
  "name": "com.social_pip.app",
  "description": "Social-Pip Desktop App",
  "path": "PATH_TO_EXECUTABLE",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://EXTENSION_ID/"
  ]
}
```

### Fields

- `name`: Must match what the extension uses in `chrome.runtime.connectNative('com.social_pip.app')`
- `path`: Absolute path to the native executable (the Tauri app)
- `type`: Always `"stdio"` for Chrome Native Messaging
- `allowed_origins`: Array of extension IDs allowed to connect

## Message Protocol

The extension sends JSON messages via `chrome.runtime.connectNative()`. Example:

```javascript
// In extension background script
const port = chrome.runtime.connectNative('com.social_pip.app');

port.postMessage({
  type: 'check_can_post',
  platform: 'facebook',
  action: 'post'
});

port.onMessage.addListener((response) => {
  console.log('Response:', response);
});
```

### Supported Message Types

| Type | Description | Parameters |
|------|-------------|------------|
| `check_can_post` | Check if action is allowed by anti-ban | `platform`, `action` |
| `get_next_delay` | Get delay before next action | `platform` |
| `record_post_action` | Record a posting action | `platform`, `action`, `success`, `delay_used_ms` |
| `should_break` | Check if batch break is needed | `platform` |
| `task_result` | Report task completion | `result` object |

## Troubleshooting

### "Native messaging host not found"

1. Verify the registry entry exists:
   ```powershell
   Get-ItemProperty "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.social_pip.app"
   ```

2. Verify the manifest file exists at the path in the registry

3. Verify the extension ID in `allowed_origins` matches your extension

### "Native messaging connection failed"

1. Check that the executable path in the manifest is correct
2. Ensure the executable has proper permissions
3. Check Chrome's console for detailed errors

### "Access denied"

- Run the installation script as Administrator
- Check antivirus software isn't blocking the executable

### Debug Mode

Enable Chrome's native messaging debug logs:

```bash
# Windows (PowerShell)
$env:CHROME_LOG_FILE="C:\chrome_debug.log"
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --enable-logging --v=1
```

## Security Considerations

1. **Extension ID Verification**: Only listed extension IDs can connect
2. **Local Communication**: Native messaging only works with local executables
3. **User Initiated**: The extension must be explicitly loaded by the user
4. **No Network Exposure**: Communication is entirely local (stdin/stdout)

## Uninstall

```powershell
.\install.ps1 -Uninstall
```

Or manually:
```powershell
Remove-Item "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.social_pip.app" -Force
```

## Related Files

- Extension background script: `apps/extension/src/background/index.ts`
- Tauri commands: `apps/desktop/src-tauri/src/main.rs`
- Anti-ban engine: `apps/desktop/src-tauri/src/anti_ban.rs`
