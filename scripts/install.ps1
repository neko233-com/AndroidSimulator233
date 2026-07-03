# AndroidSimulator233 - Windows Installer
# Run this script in PowerShell to install AndroidSimulator233

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AndroidSimulator233 Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[!] Recommended to run as Administrator for best experience" -ForegroundColor Yellow
    Write-Host ""
}

# Create installation directory
$installDir = "$env:LOCALAPPDATA\AndroidSimulator233"
Write-Host "[1/4] Creating installation directory..." -ForegroundColor Green
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}
Write-Host "      $installDir" -ForegroundColor Gray

# Download latest release
Write-Host "[2/4] Downloading latest release..." -ForegroundColor Green
$releasesUrl = "https://api.github.com/repos/neko233-com/AndroidSimulator233/releases/latest"
try {
    $release = Invoke-RestMethod -Uri $releasesUrl
    $asset = $release.assets | Where-Object { $_.name -like "*.exe" -or $_.name -like "*.msi" } | Select-Object -First 1
    
    if ($asset) {
        $downloadUrl = $asset.browser_download_url
        $installerPath = "$env:TEMP\AndroidSimulator233-setup.exe"
        
        Write-Host "      Downloading $($asset.name)..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath
    } else {
        Write-Host "      No installer found in latest release" -ForegroundColor Yellow
        Write-Host "      Please download manually from: https://github.com/neko233-com/AndroidSimulator233/releases" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "      Failed to fetch release info: $_" -ForegroundColor Red
    Write-Host "      Please download manually from: https://github.com/neko233-com/AndroidSimulator233/releases" -ForegroundColor Yellow
    exit 1
}

# Run installer
Write-Host "[3/4] Running installer..." -ForegroundColor Green
Start-Process -FilePath $installerPath -Wait

# Cleanup
Write-Host "[4/4] Cleaning up..." -ForegroundColor Green
Remove-Item -Path $installerPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Launch AndroidSimulator233 from:" -ForegroundColor White
Write-Host "  - Start Menu" -ForegroundColor Gray
Write-Host "  - Desktop shortcut" -ForegroundColor Gray
Write-Host "  - $installDir" -ForegroundColor Gray
Write-Host ""
