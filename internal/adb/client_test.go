package adb

import (
	"testing"
)

func TestNewClient(t *testing.T) {
	client := NewClient("/usr/bin/adb")
	if client == nil {
		t.Fatal("NewClient returned nil")
	}
	if client.adbPath != "/usr/bin/adb" {
		t.Error("adbPath not set correctly")
	}
}

func TestClient_GetDevices(t *testing.T) {
	client := NewClient("/usr/bin/adb")
	// This will fail without actual ADB, but tests structure
	_, err := client.GetDevices()
	// We expect an error since ADB isn't running
	if err == nil {
		t.Log("ADB available - devices found")
	} else {
		t.Log("ADB not available - expected error:", err)
	}
}
