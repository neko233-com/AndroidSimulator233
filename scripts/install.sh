#!/bin/bash
# AndroidSimulator233 - macOS/Linux Installer
# Run this script to install AndroidSimulator233

set -e

echo "========================================"
echo "  AndroidSimulator233 Installer"
echo "========================================"
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "Detected OS: ${MACHINE}"
echo ""

# Create installation directory
INSTALL_DIR="$HOME/Applications/AndroidSimulator233"
echo "[1/4] Creating installation directory..."
mkdir -p "$INSTALL_DIR"
echo "      $INSTALL_DIR"

# Download latest release
echo "[2/4] Downloading latest release..."
RELEASE_URL="https://api.github.com/repos/neko233-com/AndroidSimulator233/releases/latest"

if command -v curl &> /dev/null; then
    RELEASE_INFO=$(curl -s "$RELEASE_URL")
elif command -v wget &> /dev/null; then
    RELEASE_INFO=$(wget -qO- "$RELEASE_URL")
else
    echo "      Error: curl or wget is required"
    exit 1
fi

# Extract download URL
if [ "${MACHINE}" = "Mac" ]; then
    DOWNLOAD_URL=$(echo "$RELEASE_INFO" | grep -o '"browser_download_url": *"[^"]*\.dmg"' | cut -d'"' -f4)
else
    DOWNLOAD_URL=$(echo "$RELEASE_INFO" | grep -o '"browser_download_url": *"[^"]*\.AppImage"' | cut -d'"' -f4)
fi

if [ -z "$DOWNLOAD_URL" ]; then
    echo "      No installer found in latest release"
    echo "      Please download manually from: https://github.com/neko233-com/AndroidSimulator233/releases"
    exit 1
fi

# Download
INSTALLER_PATH="/tmp/AndroidSimulator233-installer"
if command -v curl &> /dev/null; then
    curl -L -o "$INSTALLER_PATH" "$DOWNLOAD_URL"
else
    wget -O "$INSTALLER_PATH" "$DOWNLOAD_URL"
fi

# Install
echo "[3/4] Installing..."
if [ "${MACHINE}" = "Mac" ]; then
    # Mount DMG and copy to Applications
    hdiutil attach "$INSTALLER_PATH" -nobrowse -quiet
    cp -R /Volumes/AndroidSimulator233/*.app /Applications/
    hdiutil detach /Volumes/AndroidSimulator233 -quiet
else
    # Make AppImage executable and copy
    chmod +x "$INSTALLER_PATH"
    mv "$INSTALLER_PATH" "$INSTALL_DIR/AndroidSimulator233.AppImage"
    
    # Create desktop entry
    DESKTOP_FILE="$HOME/.local/share/applications/AndroidSimulator233.desktop"
    mkdir -p "$(dirname "$DESKTOP_FILE")"
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=AndroidSimulator233
Exec=$INSTALL_DIR/AndroidSimulator233.AppImage
Icon=AndroidSimulator233
Type=Application
Categories=Development;
EOF
fi

# Cleanup
echo "[4/4] Cleaning up..."
rm -f "$INSTALLER_PATH"

echo ""
echo "========================================"
echo "  Installation Complete!"
echo "========================================"
echo ""
echo "Launch AndroidSimulator233 from:"
if [ "${MACHINE}" = "Mac" ]; then
    echo "  - Applications folder"
    echo "  - Spotlight search"
else
    echo "  - Application menu"
    echo "  - $INSTALL_DIR/AndroidSimulator233.AppImage"
fi
echo ""
