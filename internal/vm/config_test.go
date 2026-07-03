package vm

import (
	"path/filepath"
	"testing"
)

func TestVMConfig_SaveLoad(t *testing.T) {
	dir := t.TempDir()
	configPath := filepath.Join(dir, "vm.json")

	config := &VMConfig{
		Name:    "Test VM",
		CPUs:    4,
		RAM:     "4G",
		Disk:    filepath.Join(dir, "disk.qcow2"),
		Android: "android-12",
	}

	err := config.Save(configPath)
	if err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	loaded := &VMConfig{}
	err = loaded.Load(configPath)
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}

	if loaded.Name != config.Name {
		t.Errorf("Name mismatch: got %s, want %s", loaded.Name, config.Name)
	}
	if loaded.CPUs != config.CPUs {
		t.Errorf("CPUs mismatch: got %d, want %d", loaded.CPUs, config.CPUs)
	}
}
