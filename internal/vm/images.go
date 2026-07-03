package vm

import (
	"fmt"
	"os"
	"path/filepath"
)

type ImageInfo struct {
	Version    string
	Path       string
	Size       int64
	Downloaded bool
	URL        string
}

type ImageManager struct {
	imageDir string
}

var availableImages = []struct {
	Version string
	URL     string
	Size    int64
}{
	{"android-15", "https://github.com/AndroidSimulator233/system-images/releases/download/android-15/system.img", 2_500_000_000},
	{"android-14", "https://github.com/AndroidSimulator233/system-images/releases/download/android-14/system.img", 2_000_000_000},
	{"android-12", "https://github.com/AndroidSimulator233/system-images/releases/download/android-12/system.img", 1_500_000_000},
}

// DefaultImage is the default Android version for new VMs
const DefaultImage = "android-15"

// DefaultApps are pre-installed apps via first-boot script
var DefaultApps = []string{
	"com.android.chrome",        // Chrome
	"com.taptap.global",         // TapTap
	"com.android.vending",       // Google Play Store
	"com.google.android.gms",    // Google Play Services
}

func NewImageManager(imageDir string) *ImageManager {
	os.MkdirAll(imageDir, 0755)
	return &ImageManager{imageDir: imageDir}
}

func (m *ImageManager) ListAvailable() []ImageInfo {
	var images []ImageInfo

	for _, img := range availableImages {
		path := filepath.Join(m.imageDir, img.Version+".qcow2")
		_, err := os.Stat(path)

		info := ImageInfo{
			Version:    img.Version,
			Path:       path,
			Size:       img.Size,
			Downloaded: err == nil,
			URL:        img.URL,
		}
		images = append(images, info)
	}

	return images
}

func (m *ImageManager) GetImage(version string) (string, error) {
	path := filepath.Join(m.imageDir, version+".qcow2")
	if _, err := os.Stat(path); err != nil {
		return "", fmt.Errorf("image %s not found: %w", version, err)
	}
	return path, nil
}

func (m *ImageManager) CreateOverlay(baseVersion, overlayName string) (string, error) {
	basePath, err := m.GetImage(baseVersion)
	if err != nil {
		return "", err
	}

	overlayPath := filepath.Join(m.imageDir, overlayName+".qcow2")

	// Create qcow2 overlay using qemu-img
	// TODO: implement qemu-img create -f qcow2 -b base.qcow2 overlay.qcow2
	_ = basePath
	_ = overlayPath

	return overlayPath, nil
}

func (m *ImageManager) GetDefaultApps() []string {
	return DefaultApps
}
