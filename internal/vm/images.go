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
}

type ImageManager struct {
	imageDir string
}

var availableImages = []struct {
	Version string
	URL     string
	Size    int64
}{
	{"android-9", "https://example.com/android-9.qcow2", 1_000_000_000},
	{"android-12", "https://example.com/android-12.qcow2", 1_500_000_000},
	{"android-14", "https://example.com/android-14.qcow2", 2_000_000_000},
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