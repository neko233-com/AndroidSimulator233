package vm

import (
	"encoding/json"
	"os"
)

type VMConfig struct {
	Name        string `json:"name"`
	CPUs        int    `json:"cpus"`
	RAM         string `json:"ram"`
	Disk        string `json:"disk"`
	Android     string `json:"android"`
	Resolution  string `json:"resolution,omitempty"`
	DPI         int    `json:"dpi,omitempty"`
	Performance string `json:"performance,omitempty"`
	Renderer    string `json:"renderer,omitempty"`
	MaxFPS      int    `json:"maxFps,omitempty"`
	Root        bool   `json:"root,omitempty"`
	PhoneBrand  string `json:"phoneBrand,omitempty"`
	PhoneModel  string `json:"phoneModel,omitempty"`
	Display     string `json:"display,omitempty"`
	ADBPort     int    `json:"adbPort,omitempty"`
	VNCPort     int    `json:"vncPort,omitempty"`
	GPU         string `json:"gpu,omitempty"`
	Network     string `json:"network,omitempty"`
	FirstBoot   bool   `json:"firstBoot,omitempty"`
	SetupStatus string `json:"setupStatus,omitempty"` // "pending", "installing", "done"
}

func (c *VMConfig) Save(path string) error {
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

func (c *VMConfig) Load(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, c)
}

// NeedsSetup returns true if this VM needs first-boot app installation
func (c *VMConfig) NeedsSetup() bool {
	return c.FirstBoot || c.SetupStatus == "" || c.SetupStatus == "pending"
}

// MarkSetupComplete marks the VM as having completed first-boot setup
func (c *VMConfig) MarkSetupComplete() {
	c.FirstBoot = false
	c.SetupStatus = "done"
}
