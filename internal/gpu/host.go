package gpu

import (
	"os/exec"
	"runtime"
	"strings"
)

type HostGPU struct {
	Name      string
	Driver    string
	Memory    int
	Available bool
}

func DetectHostGPU() []HostGPU {
	var gpus []HostGPU

	switch runtime.GOOS {
	case "windows":
		gpus = detectWindowsGPU()
	case "darwin":
		gpus = detectMacOSGPU()
	case "linux":
		gpus = detectLinuxGPU()
	}

	return gpus
}

func detectWindowsGPU() []HostGPU {
	// Use WMIC to detect GPU
	cmd := exec.Command("wmic", "path", "win32_videocontroller", "get", "name,driverversion")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil
	}

	var gpus []HostGPU
	lines := strings.Split(string(output), "\n")
	for _, line := range lines[1:] { // skip header
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		gpus = append(gpus, HostGPU{
			Name:      line,
			Available: true,
		})
	}

	return gpus
}

func detectMacOSGPU() []HostGPU {
	// macOS uses integrated GPU via HVF
	return []HostGPU{
		{Name: "Apple GPU (HVF)", Driver: "HVF", Available: true},
	}
}

func detectLinuxGPU() []HostGPU {
	// Use lspci
	cmd := exec.Command("lspci", "-v")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil
	}

	var gpus []HostGPU
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "VGA") || strings.Contains(line, "3D") {
			gpus = append(gpus, HostGPU{
				Name:      strings.TrimSpace(line),
				Available: true,
			})
		}
	}

	return gpus
}
