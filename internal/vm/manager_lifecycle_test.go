package vm

import (
	"os"
	"path/filepath"
	"testing"
)

func TestVMManager_RenameMovesConfigAndDisk(t *testing.T) {
	dir := t.TempDir()
	manager, err := NewVMManager(dir)
	if err != nil {
		t.Fatalf("NewVMManager failed: %v", err)
	}

	config, err := manager.CreateWithOptions(CreateOptions{Name: "MuMu安卓设备", Android: "android-12"})
	if err != nil {
		t.Fatalf("CreateWithOptions failed: %v", err)
	}
	if err := os.WriteFile(config.Disk, []byte("disk"), 0644); err != nil {
		t.Fatalf("write disk failed: %v", err)
	}

	renamed, err := manager.Rename("MuMu安卓设备", "MuMu安卓设备-改名")
	if err != nil {
		t.Fatalf("Rename failed: %v", err)
	}

	if renamed.Name != "MuMu安卓设备-改名" {
		t.Fatalf("renamed name = %q", renamed.Name)
	}
	if _, ok := manager.Get("MuMu安卓设备"); ok {
		t.Fatal("old VM name still exists")
	}
	if _, ok := manager.Get("MuMu安卓设备-改名"); !ok {
		t.Fatal("new VM name missing")
	}
	if _, err := os.Stat(filepath.Join(dir, "MuMu安卓设备.json")); !os.IsNotExist(err) {
		t.Fatalf("old config should be removed, err=%v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, "MuMu安卓设备-改名.json")); err != nil {
		t.Fatalf("new config missing: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, "MuMu安卓设备-改名.qcow2")); err != nil {
		t.Fatalf("new disk missing: %v", err)
	}
}

func TestVMManager_CloneCopiesConfigDiskAndPorts(t *testing.T) {
	dir := t.TempDir()
	manager, err := NewVMManager(dir)
	if err != nil {
		t.Fatalf("NewVMManager failed: %v", err)
	}

	config, err := manager.CreateWithOptions(CreateOptions{Name: "MuMu安卓设备", Android: "android-12", Renderer: "directx"})
	if err != nil {
		t.Fatalf("CreateWithOptions failed: %v", err)
	}
	if err := os.WriteFile(config.Disk, []byte("disk"), 0644); err != nil {
		t.Fatalf("write disk failed: %v", err)
	}

	clone, err := manager.Clone("MuMu安卓设备", "MuMu安卓设备-复制")
	if err != nil {
		t.Fatalf("Clone failed: %v", err)
	}

	if clone.Name != "MuMu安卓设备-复制" {
		t.Fatalf("clone name = %q", clone.Name)
	}
	if clone.Android != config.Android || clone.CPUs != config.CPUs || clone.RAM != config.RAM {
		t.Fatal("clone did not preserve core config")
	}
	if clone.Renderer != "vulkan" {
		t.Fatalf("clone renderer = %q, want vulkan", clone.Renderer)
	}
	if clone.ADBPort == config.ADBPort || clone.VNCPort == config.VNCPort {
		t.Fatalf("clone ports were not reallocated: source adb=%d vnc=%d clone adb=%d vnc=%d", config.ADBPort, config.VNCPort, clone.ADBPort, clone.VNCPort)
	}
	data, err := os.ReadFile(clone.Disk)
	if err != nil {
		t.Fatalf("clone disk missing: %v", err)
	}
	if string(data) != "disk" {
		t.Fatalf("clone disk data = %q", string(data))
	}
}
