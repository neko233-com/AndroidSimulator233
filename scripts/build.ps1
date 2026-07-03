# AndroidSimulator233 - Windows Build Script
# Run this script in PowerShell to build the project

$ErrorActionPreference = "Stop"

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

# Check Wails
if (-not (Get-Command "wails" -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Wails v3..." -ForegroundColor Yellow
    go install github.com/wailsapp/wails/v3/cmd/wails@latest
}
Write-Host "  Wails: installed" -ForegroundColor Gray

Write-Host ""
Write-Host "Building frontend..." -ForegroundColor Green
Set-Location frontend
npm install
npm run build
Set-Location ..

Write-Host ""
Write-Host "Building application..." -ForegroundColor Green
wails build

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Binary location:" -ForegroundColor White
Write-Host "  bin\AndroidSimulator233.exe" -ForegroundColor Gray
Write-Host ""
