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

# Check Wails v3
if ! command -v wails3 &> /dev/null; then
    echo "Installing Wails v3..."
    go install github.com/wailsapp/wails/v3/cmd/wails3@latest
    WAILS3_BIN="$(go env GOPATH)/bin/wails3"
    if [ ! -x "$WAILS3_BIN" ]; then
        echo "Error: wails3 was installed but not found at $WAILS3_BIN"
        exit 1
    fi
else
    WAILS3_BIN="$(command -v wails3)"
fi
echo "  Wails v3: installed"

echo ""
echo "Installing frontend dependencies..."
cd frontend
npm ci
cd ..

echo ""
echo "Building application..."
"$WAILS3_BIN" build

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo ""
echo "Binary location:"
echo "  bin/AndroidSimulator233"
echo ""
