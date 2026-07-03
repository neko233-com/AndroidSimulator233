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
	if !contains(args, "4") {
		t.Error("missing CPU count")
	}
	// KVM is only supported on Linux/macOS, not Windows
	if isKVMSupported() && !contains(args, "-enable-kvm") {
		t.Error("missing -enable-kvm flag on supported platform")
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
