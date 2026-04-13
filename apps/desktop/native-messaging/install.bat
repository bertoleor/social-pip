@echo off
REM Social-Pip Native Messaging Installation Script
REM This script installs the native messaging host configuration for Chrome

echo ============================================
echo Social-Pip Native Messaging Installer
echo ============================================
echo.

REM Check if running as administrator (optional but recommended)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo NOTE: Not running as administrator. Installing to current user only.
    echo.
)

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"

REM Path to the native messaging host manifest
set "MANIFEST_PATH=%SCRIPT_DIR%com.social_pip.app.json"

echo Manifest location: %MANIFEST_PATH%
echo.

REM Check if manifest file exists
if not exist "%MANIFEST_PATH%" (
    echo ERROR: Native messaging manifest not found!
    echo Expected: %MANIFEST_PATH%
    echo.
    echo Please run this script from the native-messaging directory.
    pause
    exit /b 1
)

REM Install registry entry for Chrome
echo Installing native messaging host registry entry...
reg add "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.social_pip.app" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo Installation successful!
    echo ============================================
    echo.
    echo IMPORTANT STEPS REMAINING:
    echo.
    echo 1. Get your Chrome Extension ID:
    echo    - Open chrome://extensions
    echo    - Enable "Developer mode" (top right)
    echo    - Load the extension from: apps\extension
    echo    - Copy the extension ID shown below the extension name
    echo.
    echo 2. Update the manifest file:
    echo    - Edit: %MANIFEST_PATH%
    echo    - Replace EXTENSION_ID with your actual extension ID
    echo    - Replace PLACEHOLDER_PATH_TO_EXECUTABLE with the path to social-pip.exe
    echo.
    echo 3. Build the Tauri app:
    echo    - Run: pnpm build:desktop
    echo    - The executable will be in: apps\desktop\src-tauri\target\release\
    echo.
    echo 4. Restart Chrome to apply changes
    echo.
) else (
    echo.
    echo ERROR: Failed to install registry entry.
    echo Please try running as administrator.
    pause
    exit /b 1
)

pause
