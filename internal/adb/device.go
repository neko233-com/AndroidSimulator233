package adb

type Device struct {
	ID     string
	Status string // "device", "offline", "unauthorized"
}
