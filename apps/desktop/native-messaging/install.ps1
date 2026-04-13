# Social-Pip Native Messaging Installation Script (PowerShell)
# This script installs the native messaging host configuration for Chrome

param(
    [switch]$Uninstall,
    [string]$ExtensionId,
    [string]$ExecutablePath
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ManifestPath = Join-Path $ScriptDir "com.social_pip.app.json"
$RegistryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.social_pip.app"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Social-Pip Native Messaging Installer" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($Uninstall) {
    Write-Host "Uninstalling native messaging host..." -ForegroundColor Yellow
    
    if (Test-Path $RegistryPath) {
        Remove-Item -Path $RegistryPath -Force
        Write-Host "Registry entry removed successfully." -ForegroundColor Green
    } else {
        Write-Host "Registry entry not found (already uninstalled)." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Uninstall complete. Restart Chrome to apply changes." -ForegroundColor Green
    exit 0
}

# Install mode
Write-Host "Checking manifest file..." -ForegroundColor Yellow

if (-not (Test-Path $ManifestPath)) {
    Write-Host "ERROR: Native messaging manifest not found!" -ForegroundColor Red
    Write-Host "Expected: $ManifestPath" -ForegroundColor Red
    exit 1
}

# Read and update manifest if parameters provided
if ($ExtensionId -or $ExecutablePath) {
    Write-Host "Updating manifest with provided values..." -ForegroundColor Yellow
    
    $manifest = Get-Content $ManifestPath | ConvertFrom-Json
    
    if ($ExtensionId) {
        $manifest.allowed_origins = @("chrome-extension://$ExtensionId/")
        Write-Host "  - Extension ID: $ExtensionId" -ForegroundColor Green
    }
    
    if ($ExecutablePath) {
        # Convert to absolute path and escape backslashes for JSON
        $absPath = (Resolve-Path $ExecutablePath -ErrorAction SilentlyContinue).Path
        if (-not $absPath) {
            $absPath = $ExecutablePath
        }
        $manifest.path = $absPath
        Write-Host "  - Executable: $absPath" -ForegroundColor Green
    }
    
    $manifest | ConvertTo-Json -Depth 10 | Set-Content $ManifestPath
    Write-Host "Manifest updated." -ForegroundColor Green
}

# Create registry entry
Write-Host ""
Write-Host "Installing native messaging host registry entry..." -ForegroundColor Yellow

# Ensure parent key exists
$parentPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts"
if (-not (Test-Path $parentPath)) {
    New-Item -Path $parentPath -Force | Out-Null
}

# Create or update the registry entry
New-ItemProperty -Path $parentPath -Name "com.social_pip.app" -Value $ManifestPath -PropertyType String -Force | Out-Null

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Installation successful!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

if (-not $ExtensionId -or -not $ExecutablePath) {
    Write-Host "IMPORTANT STEPS REMAINING:" -ForegroundColor Yellow
    Write-Host ""
    
    if (-not $ExtensionId) {
        Write-Host "1. Get your Chrome Extension ID:" -ForegroundColor White
        Write-Host "   - Open chrome://extensions" -ForegroundColor Gray
        Write-Host "   - Enable 'Developer mode' (top right)" -ForegroundColor Gray
        Write-Host "   - Load the extension from: apps\extension" -ForegroundColor Gray
        Write-Host "   - Copy the extension ID shown below the extension name" -ForegroundColor Gray
        Write-Host ""
    }
    
    if (-not $ExecutablePath) {
        Write-Host "2. Build the Tauri app:" -ForegroundColor White
        Write-Host "   - Run: pnpm build:desktop" -ForegroundColor Gray
        Write-Host "   - The executable will be in: apps\desktop\src-tauri\target\release\social-pip.exe" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "3. Update the manifest file:" -ForegroundColor White
    Write-Host "   - Edit: $ManifestPath" -ForegroundColor Gray
    Write-Host "   - Replace EXTENSION_ID with your actual extension ID" -ForegroundColor Gray
    Write-Host "   - Replace PLACEHOLDER_PATH_TO_EXECUTABLE with the path to social-pip.exe" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "4. Re-run this script with parameters:" -ForegroundColor White
    Write-Host "   .\install.ps1 -ExtensionId 'YOUR_EXTENSION_ID' -ExecutablePath 'C:\path\to\social-pip.exe'" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "5. Restart Chrome to apply changes" -ForegroundColor White
Write-Host ""

# Verify installation
Write-Host "Verifying installation..." -ForegroundColor Yellow
$installed = Get-ItemProperty -Path $RegistryPath -ErrorAction SilentlyContinue
if ($installed) {
    Write-Host "Registry entry verified: $($installed.'(default)')" -ForegroundColor Green
} else {
    Write-Host "Warning: Could not verify registry entry" -ForegroundColor Yellow
}
