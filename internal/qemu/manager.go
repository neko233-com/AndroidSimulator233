package qemu

import (
	"fmt"
	"sync"
	"time"
)

type QEMUInstance struct {
	ID      string
	Config  *QEMUConfig
	Status  string // "stopped", "starting", "running", "stopping"
	Process interface{} // *os.Process placeholder
	mu      sync.Mutex
}

type Manager struct {
	instances map[string]*QEMUInstance
	mu        sync.RWMutex
	nextID    int
}

func NewManager() *Manager {
	return &Manager{
		instances: make(map[string]*QEMUInstance),
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
		return fmt.Errorf("cannot delete running instance %s", id)
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

	i.Status = "starting"

	// TODO: launch QEMU process
	// For now, simulate startup
	go func() {
		time.Sleep(100 * time.Millisecond)
		i.mu.Lock()
		i.Status = "running"
		i.mu.Unlock()
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

	// TODO: send QMP quit command
	go func() {
		time.Sleep(50 * time.Millisecond)
		i.mu.Lock()
		i.Status = "stopped"
		i.mu.Unlock()
	}()

	return nil
}

func (i *QEMUInstance) GetStatus() string {
	i.mu.Lock()
	defer i.mu.Unlock()
	return i.Status
}
