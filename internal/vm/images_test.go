package vm

import (
	"testing"
)

func TestImageManager_ListAvailable(t *testing.T) {
	dir := t.TempDir()
	mgr := NewImageManager(dir)

	images := mgr.ListAvailable()
	if len(images) == 0 {
		t.Error("should have at least one available image")
	}

	found := false
	for _, img := range images {
		if img.Version == "android-12" {
			found = true
			break
		}
	}
	if !found {
		t.Error("should have android-12 image")
	}
}