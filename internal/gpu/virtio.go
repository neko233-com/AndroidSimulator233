package gpu

import (
	"fmt"
	"runtime"
)

type GPUConfig struct {
	Type         string // "virtio", "none", "passthrough"
	VRAM         int    // MB
	Acceleration bool
}

func DetectGPU() GPUConfig {
	config := GPUConfig{
		Type:         "virtio",
		VRAM:         128,
		Acceleration: false,
	}

	switch runtime.GOOS {
	case "linux":
		// Check for KVM + virtio-gpu support
		config.Acceleration = true
	case "darwin":
		// HVF + virtio-gpu
		config.Acceleration = true
	case "windows":
		// Check for WHPX
		config.Acceleration = false // Will need detection
	}

	return config
}

func ApplyGPUArgs(config GPUConfig, args []string) []string {
	if config.Type == "none" {
		return append(args, "-device", "VGA")
	}

	// virtio-gpu with 3D acceleration
	args = append(args, "-device", "virtio-vga-gl")

	if config.VRAM > 0 {
		args = append(args, "-device", fmt.Sprintf("virtio-vga-gl,vram_size_mb=%d", config.VRAM))
	}

	return args
}
