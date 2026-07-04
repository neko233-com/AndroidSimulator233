package qemu

import (
	"testing"
)

func TestQEMUConfig_BuildArgs(t *testing.T) {
	config := &QEMUConfig{
		CPUs:    4,
		RAM:     "4G",
		Disk:    "/path/to/disk.qcow2",
		Display: "vnc=:0",
		GPU:     "virtio",
		Network: "user",
		ADBPort: 5555,
		KVM:     true,
	}

	args := config.BuildArgs()

	// Check essential flags exist
	if !contains(args, "-m") {
		t.Error("missing -m flag")
	}
	if !contains(args, "4G") {
		t.Error("missing RAM value")
	}
	if !contains(args, "-smp") {
		t.Error("missing -smp flag")
	}
	if !contains(args, "4,sockets=1,cores=4,threads=1") {
		t.Error("missing CPU count")
	}
	if !contains(args, "virtio-vga-gl,blob=true,hostmem=1024M") {
		t.Error("missing Vulkan virtio GPU device")
	}
	if !contains(args, "-display") || !contains(args, "vnc=:0") {
		t.Error("missing configured display backend")
	}
	// -enable-kvm is Linux-only; HVF/WHPX are selected through -machine accel=...
	if isKVMSupported() && !contains(args, "-enable-kvm") {
		t.Error("missing -enable-kvm flag on supported platform")
	}
}

func TestQEMUConfig_BuildArgs_VulkanOnlyWindow(t *testing.T) {
	config := &QEMUConfig{
		CPUs:        6,
		RAM:         "12G",
		Disk:        "/path/to/disk.qcow2",
		Display:     "window",
		Renderer:    "directx",
		Performance: "high",
		ADBPort:     7555,
		KVM:         true,
	}

	args := config.BuildArgs()
	if !contains(args, "virtio-vga-gl,blob=true,hostmem=2048M") {
		t.Error("high performance Vulkan GPU device was not selected")
	}
	if contains(args, "directx") || contains(args, "DirectX") {
		t.Error("non-Vulkan renderer leaked into QEMU args")
	}
	if !contains(args, "-display") {
		t.Fatal("missing display flag")
	}
	switch {
	case contains(args, "sdl,gl=on"):
	case contains(args, "gtk,gl=on"):
	default:
		t.Fatalf("window display should use GL acceleration, got %v", args)
	}
}

func TestQEMUConfig_BuildArgs_CustomUsesHighPerformanceVulkan(t *testing.T) {
	config := &QEMUConfig{
		CPUs:        6,
		RAM:         "12G",
		Disk:        "/path/to/disk.qcow2",
		Display:     "window",
		Renderer:    "vulkan",
		Performance: "custom",
		ADBPort:     7555,
	}

	args := config.BuildArgs()
	if !contains(args, "virtio-vga-gl,blob=true,hostmem=2048M") {
		t.Error("custom performance should keep the high performance Vulkan GPU device")
	}
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
