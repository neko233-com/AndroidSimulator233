# AndroidSimulator233 - Windows Build Script
# Run this script in PowerShell to build the project

$ErrorActionPreference = "Stop"

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE"
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AndroidSimulator233 Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Green

# Check Go
if (-not (Get-Command "go" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Go is not installed" -ForegroundColor Red
    Write-Host "Install from: https://go.dev/dl/" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Go: $(go version)" -ForegroundColor Gray

# Check Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed" -ForegroundColor Red
    Write-Host "Install from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Node.js: $(node --version)" -ForegroundColor Gray

# Check Wails v3
$wails3 = Get-Command "wails3" -ErrorAction SilentlyContinue
if (-not $wails3) {
    Write-Host "Installing Wails v3..." -ForegroundColor Yellow
    go install github.com/wailsapp/wails/v3/cmd/wails3@latest
    $goPath = (go env GOPATH).Trim()
    $wails3Path = Join-Path $goPath "bin\wails3.exe"
    if (-not (Test-Path $wails3Path)) {
        Write-Host "Error: wails3 was installed but not found at $wails3Path" -ForegroundColor Red
        exit 1
    }
} else {
    $wails3Path = $wails3.Source
}
Write-Host "  Wails v3: installed" -ForegroundColor Gray

Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Green
Set-Location frontend
Invoke-Checked { npm ci }
Set-Location ..

Write-Host ""
Write-Host "Building application..." -ForegroundColor Green
Invoke-Checked { & $wails3Path build }

if (Get-Command "ISCC.exe" -ErrorAction SilentlyContinue) {
    Write-Host ""
    Write-Host "Building Windows installer..." -ForegroundColor Green
    Invoke-Checked { ISCC.exe build\installer.iss }
} else {
    Write-Host ""
    Write-Host "Inno Setup not found; skipping installer package." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Binary location:" -ForegroundColor White
Write-Host "  bin\AndroidSimulator233.exe" -ForegroundColor Gray
Write-Host "Installer location:" -ForegroundColor White
Write-Host "  build\output\AndroidSimulator233-Setup.exe" -ForegroundColor Gray
Write-Host ""
