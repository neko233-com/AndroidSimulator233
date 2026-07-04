package qemu

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
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
	exe := qemuExecutableName()
	var checked []string

	for _, candidate := range qemuCandidates(exe) {
		if candidate == "" {
			continue
		}
		checked = append(checked, candidate)
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate, nil
		}
	}

	if path, err := exec.LookPath(exe); err == nil {
		return path, nil
	}

	return "", fmt.Errorf("QEMU runtime not found. Put %s under %s, set ANDROIDSIM233_QEMU, or add QEMU to PATH. Checked: %s", exe, bundledDir(), strings.Join(checked, "; "))
}

func ResolveAndroidEmulatorPath() (string, error) {
	if runtime.GOOS != "windows" {
		return "", fmt.Errorf("Android SDK emulator fallback is only configured on Windows")
	}

	var checked []string
	if env := strings.TrimSpace(os.Getenv("ANDROIDSIM233_EMULATOR")); env != "" {
		checked = append(checked, env)
		if info, err := os.Stat(env); err == nil && !info.IsDir() {
			return env, nil
		}
	}

	for _, root := range androidSDKRoots() {
		candidate := filepath.Join(root, "emulator", "emulator.exe")
		checked = append(checked, candidate)
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate, nil
		}
	}

	if path, err := exec.LookPath("emulator.exe"); err == nil {
		return path, nil
	}

	return "", fmt.Errorf("Android SDK emulator not found. Install Android SDK Emulator or set ANDROIDSIM233_EMULATOR. Checked: %s", strings.Join(checked, "; "))
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
	return filepath.Join(bundledDir(), qemuExecutableName())
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

func qemuExecutableName() string {
	switch runtime.GOOS {
	case "windows":
		return qemuBinaryWindows
	case "darwin":
		return qemuBinaryDarwin
	default:
		return qemuBinaryLinux
	}
}

func qemuCandidates(exe string) []string {
	candidates := []string{}
	if env := strings.TrimSpace(os.Getenv("ANDROIDSIM233_QEMU")); env != "" {
		candidates = append(candidates, env)
	}
	for _, configPath := range qemuRuntimeConfigPaths() {
		if path := readQEMUPath(configPath); path != "" {
			candidates = append(candidates, path)
		}
	}
	candidates = append(candidates,
		bundledPath(),
		filepath.Join(filepath.Dir(bundledDir()), exe),
	)
	if runtime.GOOS == "windows" {
		candidates = append(candidates,
			filepath.Join(os.Getenv("ProgramFiles"), "qemu", exe),
			filepath.Join(os.Getenv("ProgramFiles"), "QEMU", exe),
		)
	}
	for _, root := range androidSDKRoots() {
		candidates = append(candidates, filepath.Join(root, "emulator", "qemu", "windows-x86_64", exe))
	}
	return candidates
}

func androidSDKRoots() []string {
	if runtime.GOOS != "windows" {
		return nil
	}

	seen := map[string]bool{}
	var roots []string
	add := func(path string) {
		path = strings.TrimSpace(path)
		if path == "" {
			return
		}
		cleaned := filepath.Clean(path)
		key := strings.ToLower(cleaned)
		if seen[key] {
			return
		}
		seen[key] = true
		roots = append(roots, cleaned)
	}

	add(os.Getenv("ANDROID_HOME"))
	add(os.Getenv("ANDROID_SDK_ROOT"))
	if localAppData := os.Getenv("LOCALAPPDATA"); localAppData != "" {
		add(filepath.Join(localAppData, "Android", "Sdk"))
	}
	add(`C:\Android\Sdk`)
	add(`D:\Android\Sdk`)
	add(`D:\IDE\Android\Sdk`)
	return roots
}

func qemuRuntimeConfigPaths() []string {
	paths := []string{}
	if appData := strings.TrimSpace(os.Getenv("APPDATA")); appData != "" {
		paths = append(paths, filepath.Join(appData, "AndroidSimulator233", "runtime.json"))
	}
	if exe, err := os.Executable(); err == nil {
		paths = append(paths, filepath.Join(filepath.Dir(exe), "runtime.json"))
	}
	return paths
}

func readQEMUPath(path string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	trimmed := strings.TrimPrefix(string(data), "\ufeff")
	var config struct {
		QEMUPath string `json:"qemuPath"`
	}
	if err := json.Unmarshal([]byte(trimmed), &config); err != nil {
		return ""
	}
	return strings.TrimSpace(config.QEMUPath)
}

func DownloadQEMU() error {
	return fmt.Errorf("automatic QEMU download is not configured; install or bundle QEMU instead")

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
