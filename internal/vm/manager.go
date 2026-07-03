package vm

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/neko233/AndroidSimulator233/internal/qemu"
)

type VMManager struct {
	dataDir    string
	vms        map[string]*VMConfig
	qemu       *qemu.Manager
	mu         sync.RWMutex
}

func NewVMManager(dataDir string) (*VMManager, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data dir: %w", err)
	}

	mgr := &VMManager{
		dataDir: dataDir,
		vms:     make(map[string]*VMConfig),
		qemu:    qemu.NewManager(dataDir),
	}

	if err := mgr.loadAll(); err != nil {
		return nil, err
	}

	return mgr, nil
}

func (m *VMManager) loadAll() error {
	entries, err := os.ReadDir(m.dataDir)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if filepath.Ext(entry.Name()) != ".json" {
			continue
		}

		config := &VMConfig{}
		path := filepath.Join(m.dataDir, entry.Name())
		if err := config.Load(path); err != nil {
			continue
		}

		m.vms[entry.Name()] = config
	}

	return nil
}

func (m *VMManager) Create(name, android string) (*VMConfig, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	config := &VMConfig{
		Name:    name,
		CPUs:    2,
		RAM:     "2G",
		Android: android,
		Display: "vnc=:0",
		GPU:     "virtio",
		Network: "user",
	}

	path := filepath.Join(m.dataDir, name+".json")
	if err := config.Save(path); err != nil {
		return nil, err
	}

	m.vms[name+".json"] = config
	return config, nil
}

func (m *VMManager) Get(name string) (*VMConfig, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	config, ok := m.vms[name+".json"]
	return config, ok
}

func (m *VMManager) List() []*VMConfig {
	m.mu.RLock()
	defer m.mu.RUnlock()

	list := make([]*VMConfig, 0, len(m.vms))
	for _, config := range m.vms {
		list = append(list, config)
	}
	return list
}

func (m *VMManager) Delete(name string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Stop VM if running
	if inst, ok := m.qemu.Get(name); ok {
		if inst.IsRunning() {
			inst.Stop()
		}
	}

	path := filepath.Join(m.dataDir, name+".json")
	if err := os.Remove(path); err != nil {
		return err
	}

	delete(m.vms, name+".json")
	return nil
}

func (m *VMManager) StartVM(name string, config *VMConfig) error {
	// Create QEMU config
	qemuConfig := &qemu.QEMUConfig{
		CPUs:    config.CPUs,
		RAM:     config.RAM,
		Disk:    filepath.Join(m.dataDir, name+".qcow2"),
		Display: config.Display,
		GPU:     config.GPU,
		Network: config.Network,
		ADBPort: 5555,
		KVM:     true,
	}

	// Create QEMU instance
	instance, err := m.qemu.Create(qemuConfig)
	if err != nil {
		return fmt.Errorf("failed to create QEMU instance: %w", err)
	}

	// Start the instance
	return instance.Start()
}

func (m *VMManager) StopVM(name string) error {
	inst, ok := m.qemu.Get(name)
	if !ok {
		return fmt.Errorf("VM %s not found", name)
	}
	return inst.Stop()
}

func (m *VMManager) ResetVM(name string) error {
	inst, ok := m.qemu.Get(name)
	if !ok {
		return fmt.Errorf("VM %s not found", name)
	}
	return inst.Reset()
}

func (m *VMManager) ScreenshotVM(name, path string) error {
	inst, ok := m.qemu.Get(name)
	if !ok {
		return fmt.Errorf("VM %s not found", name)
	}
	return inst.Screenshot(path)
}
