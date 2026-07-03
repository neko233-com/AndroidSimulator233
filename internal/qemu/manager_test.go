package qemu

import (
	"os"
	"testing"
)

func TestNewManager(t *testing.T) {
	dir := t.TempDir()
	mgr := NewManager(dir)
	if mgr == nil {
		t.Fatal("NewManager returned nil")
	}
	if len(mgr.instances) != 0 {
		t.Error("new manager should have no instances")
	}
}

func TestManager_Create(t *testing.T) {
	dir := t.TempDir()
	mgr := NewManager(dir)
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

	// Verify instance is in manager
	got, ok := mgr.Get(instance.ID)
	if !ok {
		t.Fatal("Get failed")
	}
	if got.ID != instance.ID {
		t.Errorf("Get returned wrong instance: got %s, want %s", got.ID, instance.ID)
	}
}

func TestManager_Delete(t *testing.T) {
	dir := t.TempDir()
	mgr := NewManager(dir)
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

	err = mgr.Delete(instance.ID)
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}

	// Verify instance is gone
	_, ok := mgr.Get(instance.ID)
	if ok {
		t.Error("Get should return false after delete")
	}
}

func TestManager_List(t *testing.T) {
	dir := t.TempDir()
	mgr := NewManager(dir)

	// Empty list
	list := mgr.List()
	if len(list) != 0 {
		t.Error("empty manager should return empty list")
	}

	// Create some instances
	for i := 0; i < 3; i++ {
		config := &QEMUConfig{
			CPUs:    2,
			RAM:     "2G",
			Disk:    "/tmp/test.qcow2",
			Display: "vnc=:0",
			GPU:     "virtio",
			Network: "user",
			ADBPort: 5555 + i,
			KVM:     false,
		}
		_, err := mgr.Create(config)
		if err != nil {
			t.Fatalf("Create failed: %v", err)
		}
	}

	list = mgr.List()
	if len(list) != 3 {
		t.Errorf("expected 3 instances, got %d", len(list))
	}
}

func TestManager_Delete_Running(t *testing.T) {
	dir := t.TempDir()
	mgr := NewManager(dir)
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

	// Simulate running state
	instance.mu.Lock()
	instance.Status = "running"
	instance.mu.Unlock()

	// Delete should stop first then delete
	err = mgr.Delete(instance.ID)
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
}

func TestManager_Delete_NotFound(t *testing.T) {
	dir := t.TempDir()
	mgr := NewManager(dir)

	err := mgr.Delete("nonexistent")
	if err == nil {
		t.Error("Delete should fail for nonexistent instance")
	}
}

func TestManager_Get_NotFound(t *testing.T) {
	dir := t.TempDir()
	mgr := NewManager(dir)

	_, ok := mgr.Get("nonexistent")
	if ok {
		t.Error("Get should return false for nonexistent instance")
	}
}

func TestManager_Create_DiskDir(t *testing.T) {
	dir := t.TempDir()
	os.MkdirAll(dir, 0755)

	mgr := NewManager(dir)
	config := &QEMUConfig{
		CPUs:    4,
		RAM:     "4G",
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

	// Verify config is correct
	if instance.Config.CPUs != 4 {
		t.Errorf("expected 4 CPUs, got %d", instance.Config.CPUs)
	}
	if instance.Config.RAM != "4G" {
		t.Errorf("expected 4G RAM, got %s", instance.Config.RAM)
	}
}
