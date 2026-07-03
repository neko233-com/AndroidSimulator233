package qemu

import (
	"archive/zip"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
)

const (
	qemuBinaryWindows = "qemu-system-x86_64.exe"
	qemuBinaryDarwin  = "qemu-system-x86_64"
	qemuBinaryLinux   = "qemu-system-x86_64"

	// QEMU download URLs (pre-built binaries)
	qemuDownloadURLWindows = "https://github.com/AndroidSimulator233/qemu-builds/releases/download/v9.2.0/qemu-v9.2.0-windows.zip"
	qemuDownloadURLDarwin  = "https://github.com/AndroidSimulator233/qemu-builds/releases/download/v9.2.0/qemu-v9.2.0-macos.zip"
	qemuDownloadURLLinux   = "https://github.com/AndroidSimulator233/qemu-builds/releases/download/v9.2.0/qemu-v9.2.0-linux.tar.xz"
)

func ResolveQEMUPath() (string, error) {
	// 1. Check bundled location
	bundled := bundledPath()
	if _, err := os.Stat(bundled); err == nil {
		return bundled, nil
	}

	// 2. Try to download if not found
	if err := DownloadQEMU(); err != nil {
		// 3. Check system PATH as fallback
		exe := qemuBinaryLinux
		switch runtime.GOOS {
		case "windows":
			exe = qemuBinaryWindows
		case "darwin":
			exe = qemuBinaryDarwin
		}

		path, err := findInPath(exe)
		if err == nil {
			return path, nil
		}

		return "", fmt.Errorf("QEMU not found and failed to download: %w", err)
	}

	return bundledPath(), nil
}

func bundledDir() string {
	exe, _ := os.Executable()
	dir := filepath.Dir(exe)

	switch runtime.GOOS {
	case "windows":
		return filepath.Join(dir, "qemu", "win-x64")
	case "darwin":
		return filepath.Join(dir, "qemu", "macos-arm64")
	default:
		return filepath.Join(dir, "qemu", "linux-x64")
	}
}

func bundledPath() string {
	exe := qemuBinaryLinux
	switch runtime.GOOS {
	case "windows":
		exe = qemuBinaryWindows
	case "darwin":
		exe = qemuBinaryDarwin
	}
	return filepath.Join(bundledDir(), exe)
}

func findInPath(name string) (string, error) {
	path, err := os.Executable()
	if err != nil {
		return "", err
	}
	dir := filepath.Dir(path)

	// Check current directory and common locations
	locations := []string{
		dir,
		filepath.Join(dir, "qemu"),
		"/usr/bin",
		"/usr/local/bin",
		"/opt/homebrew/bin",
	}

	for _, loc := range locations {
		fullPath := filepath.Join(loc, name)
		if _, err := os.Stat(fullPath); err == nil {
			return fullPath, nil
		}
	}

	return "", fmt.Errorf("%s not found in PATH", name)
}

func DownloadQEMU() error {
	var downloadURL string
	switch runtime.GOOS {
	case "windows":
		downloadURL = qemuDownloadURLWindows
	case "darwin":
		downloadURL = qemuDownloadURLDarwin
	case "linux":
		downloadURL = qemuDownloadURLLinux
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}

	fmt.Println("Downloading QEMU...")
	fmt.Printf("URL: %s\n", downloadURL)

	// Create temp file
	tmpFile, err := os.CreateTemp("", "qemu-*.zip")
	if err != nil {
		return fmt.Errorf("failed to create temp file: %w", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	// Download
	resp, err := http.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("failed to download QEMU: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download QEMU: status %d", resp.StatusCode)
	}

	// Write to temp file
	written, err := io.Copy(tmpFile, resp.Body)
	if err != nil {
		return fmt.Errorf("failed to write QEMU download: %w", err)
	}
	fmt.Printf("Downloaded %.1f MB\n", float64(written)/1024/1024)

	// Close temp file before extraction
	tmpFile.Close()

	// Extract
	if err := extractQEMU(tmpFile.Name()); err != nil {
		return fmt.Errorf("failed to extract QEMU: %w", err)
	}

	fmt.Println("QEMU installed successfully!")
	return nil
}

func extractQEMU(zipPath string) error {
	destDir := bundledDir()
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return err
	}

	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, f := range r.File {
		fpath := filepath.Join(destDir, f.Name)

		// Ensure parent directory exists
		if err := os.MkdirAll(filepath.Dir(fpath), 0755); err != nil {
			return err
		}

		// Skip directories
		if f.FileInfo().IsDir() {
			continue
		}

		// Create file
		outFile, err := os.Create(fpath)
		if err != nil {
			return err
		}

		// Read file from zip
		rc, err := f.Open()
		if err != nil {
			outFile.Close()
			return err
		}

		// Copy file
		_, err = io.Copy(outFile, rc)
		rc.Close()
		outFile.Close()

		if err != nil {
			return err
		}

		// Make executable on Unix
		if runtime.GOOS != "windows" {
			os.Chmod(fpath, 0755)
		}
	}

	return nil
}
