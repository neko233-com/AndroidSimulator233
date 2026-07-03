//go:build darwin

package input

import "fmt"

type DarwinGamepad struct {
	devicePath string
}

func NewDarwinGamepad(devicePath string) *DarwinGamepad {
	if devicePath == "" {
		devicePath = "/dev/input/js0"
	}
	return &DarwinGamepad{devicePath: devicePath}
}

func (g *DarwinGamepad) Open() error {
	return fmt.Errorf("darwin gamepad not implemented")
}

func (g *DarwinGamepad) Close() error {
	return nil
}

func (g *DarwinGamepad) Read() (*GamepadState, error) {
	return nil, fmt.Errorf("darwin gamepad not implemented")
}

func (g *DarwinGamepad) GetName() string {
	return "Darwin Gamepad (not implemented)"
}
