package vm

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

const (
	// Android image download URLs
	androidImageURL = "https://github.com/AndroidSimulator233/system-images/releases/download/%s/system.qcow2"
)

type ImageDownloader struct {
	imageDir string
}

func NewImageDownloader(imageDir string) *ImageDownloader {
	return &ImageDownloader{imageDir: imageDir}
}

func (d *ImageDownloader) DownloadImage(version string, progress func(downloaded, total int64)) error {
	url := fmt.Sprintf(androidImageURL, version)
	destPath := filepath.Join(d.imageDir, version+".qcow2")

	// Check if already exists
	if _, err := os.Stat(destPath); err == nil {
		fmt.Printf("Image %s already exists, skipping download\n", version)
		return nil
	}

	fmt.Printf("Downloading Android %s image...\n", version)
	fmt.Printf("URL: %s\n", url)

	// Create temp file
	tmpFile, err := os.CreateTemp("", fmt.Sprintf("android-%s-*.qcow2", version))
	if err != nil {
		return fmt.Errorf("failed to create temp file: %w", err)
	}
	defer func() {
		tmpFile.Close()
		// Rename temp file to final location
		os.Rename(tmpFile.Name(), destPath)
	}()
	defer os.Remove(tmpFile.Name() + ".tmp")

	// Download
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("failed to download image: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download image: status %d", resp.StatusCode)
	}

	totalSize := resp.ContentLength
	var downloaded int64

	// Write to file with progress
	buf := make([]byte, 32*1024)
	for {
		n, err := resp.Body.Read(buf)
		if n > 0 {
			written, writeErr := tmpFile.Write(buf[:n])
			if writeErr != nil {
				return writeErr
			}
			downloaded += int64(written)

			if progress != nil {
				progress(downloaded, totalSize)
			} else if totalSize > 0 {
				// Print progress
				percent := float64(downloaded) / float64(totalSize) * 100
				fmt.Printf("\rDownloading: %.1f%% (%.1f MB / %.1f MB)", 
					percent, 
					float64(downloaded)/1024/1024, 
					float64(totalSize)/1024/1024)
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
	}

	fmt.Printf("\nDownloaded Android %s image (%.1f MB)\n", version, float64(downloaded)/1024/1024)
	return nil
}

func (d *ImageDownloader) EnsureImage(version string) (string, error) {
	destPath := filepath.Join(d.imageDir, version+".qcow2")

	// Check if exists
	if _, err := os.Stat(destPath); err == nil {
		return destPath, nil
	}

	// Download
	if err := d.DownloadImage(version, nil); err != nil {
		return "", err
	}

	return destPath, nil
}
