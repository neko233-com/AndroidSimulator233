package qemu

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

const (
	qemuBinaryWindows = "qemu-system-x86_64.exe"
	qemuBinaryDarwin  = "qemu-system-x86_64"
	qemuBinaryLinux   = "qemu-system-x86_64"
)

func ResolveQEMUPath() (string, error) {
	// 1. Check bundled location
	bundled := bundledPath()
	if _, err := os.Stat(bundled); err == nil {
		return bundled, nil
	}

	// 2. Check system PATH
	exe := qemuBinaryLinux
	switch runtime.GOOS {
	case "windows":
		exe = qemuBinaryWindows
	case "darwin":
		exe = qemuBinaryDarwin
	}

	path, err := exec.LookPath(exe)
	if err == nil {
		return path, nil
	}

	return "", fmt.Errorf("QEMU not found: install QEMU or place binary in %s", bundledDir())
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
