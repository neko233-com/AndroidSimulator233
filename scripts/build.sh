#!/bin/bash
# AndroidSimulator233 - macOS/Linux Build Script
# Run this script to build the project

set -e

echo "========================================"
echo "  AndroidSimulator233 Build Script"
echo "========================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check Go
if ! command -v go &> /dev/null; then
    echo "Error: Go is not installed"
    echo "Install from: https://go.dev/dl/"
    exit 1
fi
echo "  Go: $(go version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Install from: https://nodejs.org/"
    exit 1
fi
echo "  Node.js: $(node --version)"

# Check Wails
if ! command -v wails &> /dev/null; then
    echo "Installing Wails v3..."
    go install github.com/wailsapp/wails/v3/cmd/wails@latest
fi
echo "  Wails: installed"

echo ""
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "Building application..."
wails build

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo ""
echo "Binary location:"
echo "  bin/AndroidSimulator233"
echo ""
