package input

import (
	"encoding/json"
	"os"
)

type KeyMapping struct {
	Name     string         `json:"name"`
	Mappings []TouchMapping `json:"mappings"`
}

type TouchMapping struct {
	Key       string  `json:"key"`
	TouchX    float64 `json:"touchX"`
	TouchY    float64 `json:"touchY"`
	Action    string  `json:"action"` // "tap", "swipe", "drag"
	SwipeEndX float64 `json:"swipeEndX,omitempty"`
	SwipeEndY float64 `json:"swipeEndY,omitempty"`
}

type KeyMapManager struct {
	mappings map[string]*KeyMapping
	filePath string
}

func NewKeyMapManager(filePath string) *KeyMapManager {
	mgr := &KeyMapManager{
		mappings: make(map[string]*KeyMapping),
		filePath: filePath,
	}
	mgr.load()
	return mgr
}

func (m *KeyMapManager) load() error {
	data, err := os.ReadFile(m.filePath)
	if err != nil {
		return err
	}

	var mappings []*KeyMapping
	if err := json.Unmarshal(data, &mappings); err != nil {
		return err
	}

	for _, km := range mappings {
		m.mappings[km.Name] = km
	}

	return nil
}

func (m *KeyMapManager) Save() error {
	var mappings []*KeyMapping
	for _, km := range m.mappings {
		mappings = append(mappings, km)
	}

	data, err := json.MarshalIndent(mappings, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(m.filePath, data, 0644)
}

func (m *KeyMapManager) Get(name string) (*KeyMapping, bool) {
	km, ok := m.mappings[name]
	return km, ok
}

func (m *KeyMapManager) Set(name string, mapping *KeyMapping) {
	m.mappings[name] = mapping
}

func (m *KeyMapManager) List() []*KeyMapping {
	var list []*KeyMapping
	for _, km := range m.mappings {
		list = append(list, km)
	}
	return list
}

func (m *KeyMapManager) Delete(name string) {
	delete(m.mappings, name)
}
