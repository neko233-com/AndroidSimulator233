package vm

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type Snapshot struct {
	ID        string    `json:"id"`
	VMID      string    `json:"vmId"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	Size      int64     `json:"size"`
}

type SnapshotManager struct {
	snapshotDir string
}

func NewSnapshotManager(snapshotDir string) *SnapshotManager {
	os.MkdirAll(snapshotDir, 0755)
	return &SnapshotManager{snapshotDir: snapshotDir}
}

func (m *SnapshotManager) Create(vmID, name string) (*Snapshot, error) {
	id := fmt.Sprintf("snap-%d", time.Now().UnixNano())

	snapshot := &Snapshot{
		ID:        id,
		VMID:      vmID,
		Name:      name,
		CreatedAt: time.Now(),
	}

	path := filepath.Join(m.snapshotDir, vmID, id+".json")
	os.MkdirAll(filepath.Dir(path), 0755)

	data, err := json.MarshalIndent(snapshot, "", "  ")
	if err != nil {
		return nil, err
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
		return nil, err
	}

	// TODO: Execute QMP savevm command
	// qmp.Execute("human-monitor-command", map[string]interface{}{
	//     "command-line": fmt.Sprintf("savevm %s", id),
	// })

	return snapshot, nil
}

func (m *SnapshotManager) Restore(vmID, snapshotID string) error {
	// TODO: Execute QMP loadvm command
	// qmp.Execute("human-monitor-command", map[string]interface{}{
	//     "command-line": fmt.Sprintf("loadvm %s", snapshotID),
	// })

	return nil
}

func (m *SnapshotManager) Delete(vmID, snapshotID string) error {
	path := filepath.Join(m.snapshotDir, vmID, snapshotID+".json")
	return os.Remove(path)
}

func (m *SnapshotManager) List(vmID string) []*Snapshot {
	dir := filepath.Join(m.snapshotDir, vmID)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}

	var snapshots []*Snapshot
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".json" {
			continue
		}

		data, err := os.ReadFile(filepath.Join(dir, entry.Name()))
		if err != nil {
			continue
		}

		var snapshot Snapshot
		if err := json.Unmarshal(data, &snapshot); err != nil {
			continue
		}

		snapshots = append(snapshots, &snapshot)
	}

	return snapshots
}
