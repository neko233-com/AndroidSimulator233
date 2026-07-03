package qemu

import (
	"testing"
)

func TestNewManager(t *testing.T) {
	mgr := NewManager()
	if mgr == nil {
		t.Fatal("NewManager returned nil")
	}
	if len(mgr.instances) != 0 {
		t.Error("new manager should have no instances")
	}
}

func TestManager_Create(t *testing.T) {
	mgr := NewManager()
	config := &QEMUConfig{
		CPUs:    2,
		RAM:     "2G",
		Disk:    "/tmp/test.qcow2",
		Display: "vnc=:0",
		GPU:     "virtio",
		Network: "user",
		ADBPort: 5555,
		KVM:     false,
	}

	instance, err := mgr.Create(config)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if instance == nil {
		t.Fatal("Create returned nil instance")
	}
	if instance.ID == "" {
		t.Error("instance should have an ID")
	}
}
