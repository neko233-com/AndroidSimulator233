//go:build windows

package input

import (
	"fmt"
	"syscall"
	"unsafe"
)

var (
	xinput             = syscall.NewLazyDLL("xinput9_1_0.dll")
	procXInputGetState = xinput.NewProc("XInputGetState")
)

type XInputState struct {
	PacketNumber uint32
	Gamepad      XInputGamepad
}

type XInputGamepad struct {
	WButtons     uint16
	LeftTrigger  byte
	RightTrigger byte
	ThumbLX      int16
	ThumbLY      int16
	ThumbRX      int16
	ThumbRY      int16
}

type WindowsGamepad struct {
	deviceID int
	state    *XInputState
}

func NewWindowsGamepad(deviceID int) *WindowsGamepad {
	return &WindowsGamepad{deviceID: deviceID}
}

func (g *WindowsGamepad) Open() error {
	return nil
}

func (g *WindowsGamepad) Close() error {
	return nil
}

func (g *WindowsGamepad) Read() (*GamepadState, error) {
	var state XInputState
	ret, _, _ := procXInputGetState.Call(
		uintptr(g.deviceID),
		uintptr(unsafe.Pointer(&state)),
	)

	if ret != 0 {
		return nil, fmt.Errorf("XInputGetState failed")
	}

	g.state = &state

	buttons := [15]bool{
		state.Gamepad.WButtons&0x0001 != 0, // DPad Up
		state.Gamepad.WButtons&0x0002 != 0, // DPad Down
		state.Gamepad.WButtons&0x0004 != 0, // DPad Left
		state.Gamepad.WButtons&0x0008 != 0, // DPad Right
		state.Gamepad.WButtons&0x0010 != 0, // Start
		state.Gamepad.WButtons&0x0020 != 0, // Back
		state.Gamepad.WButtons&0x0040 != 0, // Left Thumb
		state.Gamepad.WButtons&0x0080 != 0, // Right Thumb
		state.Gamepad.WButtons&0x0100 != 0, // Left Shoulder
		state.Gamepad.WButtons&0x0200 != 0, // Right Shoulder
		state.Gamepad.WButtons&0x1000 != 0, // A
		state.Gamepad.WButtons&0x2000 != 0, // B
		state.Gamepad.WButtons&0x4000 != 0, // X
		state.Gamepad.WButtons&0x8000 != 0, // Y
		false,                              // Guide (not exposed by XInput)
	}

	axes := [6]float64{
		float64(state.Gamepad.ThumbLX) / 32767.0,
		float64(state.Gamepad.ThumbLY) / 32767.0,
		float64(state.Gamepad.ThumbRX) / 32767.0,
		float64(state.Gamepad.ThumbRY) / 32767.0,
		float64(state.Gamepad.LeftTrigger) / 255.0,
		float64(state.Gamepad.RightTrigger) / 255.0,
	}

	return &GamepadState{Buttons: buttons, Axes: axes}, nil
}

func (g *WindowsGamepad) GetName() string {
	return fmt.Sprintf("XInput Gamepad %d", g.deviceID)
}
