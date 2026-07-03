//go:build linux

package input

import (
	"fmt"
	"os"
	"unsafe"
)

type inputEvent struct {
	Time  [2]syscall.Timeval
	Type  uint16
	Code  uint16
	Value int32
}

type LinuxGamepad struct {
	devicePath string
	fd         *os.File
}

func NewLinuxGamepad(devicePath string) *LinuxGamepad {
	if devicePath == "" {
		devicePath = "/dev/input/js0"
	}
	return &LinuxGamepad{devicePath: devicePath}
}

func (g *LinuxGamepad) Open() error {
	fd, err := os.OpenFile(g.devicePath, os.O_RDONLY, 0)
	if err != nil {
		return fmt.Errorf("failed to open gamepad %s: %w", g.devicePath, err)
	}
	g.fd = fd
	return nil
}

func (g *LinuxGamepad) Close() error {
	if g.fd != nil {
		return g.fd.Close()
	}
	return nil
}

func (g *LinuxGamepad) Read() (*GamepadState, error) {
	if g.fd == nil {
		return nil, fmt.Errorf("gamepad not opened")
	}

	buf := make([]byte, int(unsafe.Sizeof(inputEvent{})))
	_, err := g.fd.Read(buf)
	if err != nil {
		return nil, fmt.Errorf("failed to read gamepad event: %w", err)
	}

	return &GamepadState{}, nil
}

func (g *LinuxGamepad) GetName() string {
	return fmt.Sprintf("Linux Gamepad (%s)", g.devicePath)
}
