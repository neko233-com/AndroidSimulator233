package vm

import (
	"testing"
)

func TestSnapshotManager_List(t *testing.T) {
	dir := t.TempDir()
	mgr := NewSnapshotManager(dir)

	snapshots := mgr.List("vm-1")
	if len(snapshots) != 0 {
		t.Error("new manager should have no snapshots")
	}
}
