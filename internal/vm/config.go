package vm

import (
	"encoding/json"
	"os"
)

type VMConfig struct {
	Name    string `json:"name"`
	CPUs    int    `json:"cpus"`
	RAM     string `json:"ram"`
	Disk    string `json:"disk"`
	Android string `json:"android"`
	Display string `json:"display,omitempty"`
	GPU     string `json:"gpu,omitempty"`
	Network string `json:"network,omitempty"`
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
