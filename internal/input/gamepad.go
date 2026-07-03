package input

type GamepadState struct {
	Buttons [15]bool
	Axes    [6]float64
}

type Gamepad interface {
	Open() error
	Close() error
	Read() (*GamepadState, error)
	GetName() string
}
