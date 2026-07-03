package api

import (
	"fmt"

	"github.com/neko233/AndroidSimulator233/internal/adb"
	"github.com/neko233/AndroidSimulator233/internal/vm"
)

type VMAPI struct {
	manager *vm.VMManager
	adb     *adb.Client
}

func NewVMAPI(manager *vm.VMManager) *VMAPI {
	return &VMAPI{
		manager: manager,
		adb:     adb.NewClient("adb"),
	}
}

type VMInfo struct {
	Name    string `json:"name"`
	CPUs    int    `json:"cpus"`
	RAM     string `json:"ram"`
	Android string `json:"android"`
	Status  string `json:"status,omitempty"`
}

func (a *VMAPI) ListVMs() []VMInfo {
	vms := a.manager.List()
	result := make([]VMInfo, len(vms))
	for i, vm := range vms {
		result[i] = VMInfo{
			Name:    vm.Name,
			CPUs:    vm.CPUs,
			RAM:     vm.RAM,
			Android: vm.Android,
		}
	}
	return result
}

func (a *VMAPI) CreateVM(name, android string) (*VMInfo, error) {
	config, err := a.manager.Create(name, android)
	if err != nil {
		return nil, err
	}
	return &VMInfo{
		Name:    config.Name,
		CPUs:    config.CPUs,
		RAM:     config.RAM,
		Android: config.Android,
	}, nil
}

func (a *VMAPI) DeleteVM(name string) error {
	return a.manager.Delete(name)
}

func (a *VMAPI) StartVM(name string) error {
	vmConfig, ok := a.manager.Get(name)
	if !ok {
		return fmt.Errorf("VM %s not found", name)
	}
	return a.manager.StartVM(name, vmConfig)
}

func (a *VMAPI) StopVM(name string) error {
	return a.manager.StopVM(name)
}

func (a *VMAPI) ResetVM(name string) error {
	return a.manager.ResetVM(name)
}

func (a *VMAPI) ScreenshotVM(name, path string) error {
	return a.manager.ScreenshotVM(name, path)
}

func (a *VMAPI) Execute(deviceID, command string) (string, error) {
	return a.adb.Shell(deviceID, command)
}

func (a *VMAPI) GetDefaultApps() []string {
	return vm.DefaultApps
}
