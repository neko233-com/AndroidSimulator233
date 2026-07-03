package qemu

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"
)

type QEMUInstance struct {
	ID      string
	Config  *QEMUConfig
	Status  string // "stopped", "starting", "running", "stopping", "error"
	Process *os.Process
	qmp     *QMPClient
	mu      sync.Mutex
}

type Manager struct {
	instances map[string]*QEMUInstance
	dataDir   string
	mu        sync.RWMutex
	nextID    int
}

func NewManager(dataDir string) *Manager {
	return &Manager{
		instances: make(map[string]*QEMUInstance),
		dataDir:   dataDir,
		nextID:    1,
	}
}

func (m *Manager) Create(config *QEMUConfig) (*QEMUInstance, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	id := fmt.Sprintf("vm-%d", m.nextID)
	m.nextID++

	instance := &QEMUInstance{
		ID:     id,
		Config: config,
		Status: "stopped",
	}

	m.instances[id] = instance
	return instance, nil
}

func (m *Manager) Get(id string) (*QEMUInstance, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	instance, ok := m.instances[id]
	return instance, ok
}

func (m *Manager) List() []*QEMUInstance {
	m.mu.RLock()
	defer m.mu.RUnlock()

	list := make([]*QEMUInstance, 0, len(m.instances))
	for _, inst := range m.instances {
		list = append(list, inst)
	}
	return list
}

func (m *Manager) Delete(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	instance, ok := m.instances[id]
	if !ok {
		return fmt.Errorf("instance %s not found", id)
	}

	if instance.Status == "running" {
		instance.Stop()
	}

	delete(m.instances, id)
	return nil
}

func (i *QEMUInstance) Start() error {
	i.mu.Lock()
	defer i.mu.Unlock()

	if i.Status == "running" {
		return fmt.Errorf("instance %s already running", i.ID)
	}

	// Resolve QEMU binary
	qemuPath, err := ResolveQEMUPath()
	if err != nil {
		return fmt.Errorf("failed to resolve QEMU path: %w", err)
	}

	// Build QEMU arguments
	args := i.Config.BuildArgs()

	// Add QMP monitor socket
	qmpSocket := filepath.Join(os.TempDir(), fmt.Sprintf("qmp-%s.sock", i.ID))
	args = append(args, "-qmp", fmt.Sprintf("unix:%s,server,nowait", qmpSocket))

	// Add serial console for Android boot
	args = append(args, "-serial", "mon:stdio")

	i.Status = "starting"

	// Launch QEMU process
	cmd := exec.Command(qemuPath, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		i.Status = "error"
		return fmt.Errorf("failed to start QEMU: %w", err)
	}

	i.Process = cmd.Process

	// Wait for QMP socket to be ready
	go func() {
		time.Sleep(2 * time.Second)

		// Connect QMP
		qmp := NewQMPClient(qmpSocket)
		if err := qmp.Connect(); err != nil {
			i.mu.Lock()
			i.Status = "error"
			i.mu.Unlock()
			return
		}

		i.mu.Lock()
		i.qmp = qmp
		i.Status = "running"
		i.mu.Unlock()
	}()

	// Monitor process exit
	go func() {
		err := cmd.Wait()
		i.mu.Lock()
		defer i.mu.Unlock()

		if i.qmp != nil {
			i.qmp.Close()
			i.qmp = nil
		}

		if err != nil {
			i.Status = "error"
		} else {
			i.Status = "stopped"
		}
		i.Process = nil
	}()

	return nil
}

func (i *QEMUInstance) Stop() error {
	i.mu.Lock()
	defer i.mu.Unlock()

	if i.Status != "running" {
		return fmt.Errorf("instance %s not running", i.ID)
	}

	i.Status = "stopping"

	// Try QMP quit first
	if i.qmp != nil {
		if err := i.qmp.Quit(); err == nil {
			// QMP quit succeeded, wait for process to exit
			go func() {
				time.Sleep(1 * time.Second)
				i.mu.Lock()
				if i.Process != nil {
					i.Process.Kill()
				}
				i.mu.Unlock()
			}()
			return nil
		}
	}

	// Fallback: kill process directly
	if i.Process != nil {
		if err := i.Process.Kill(); err != nil {
			return fmt.Errorf("failed to kill QEMU process: %w", err)
		}
	}

	return nil
}

func (i *QEMUInstance) Reset() error {
	i.mu.Lock()
	defer i.mu.Unlock()

	if i.qmp != nil {
		_, err := i.qmp.Execute("system_reset", nil)
		return err
	}

	return fmt.Errorf("QMP not connected")
}

func (i *QEMUInstance) Screenshot(path string) error {
	i.mu.Lock()
	defer i.mu.Unlock()

	if i.qmp != nil {
		return i.qmp.Screenshot(path)
	}

	return fmt.Errorf("QMP not connected")
}

func (i *QEMUInstance) GetStatus() string {
	i.mu.Lock()
	defer i.mu.Unlock()
	return i.Status
}

func (i *QEMUInstance) IsRunning() bool {
	i.mu.Lock()
	defer i.mu.Unlock()
	return i.Status == "running"
}
