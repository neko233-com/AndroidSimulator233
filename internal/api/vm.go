package api

import (
	"github.com/neko233/AndroidSimulator233/internal/vm"
)

type VMAPI struct {
	manager *vm.VMManager
}

func NewVMAPI(manager *vm.VMManager) *VMAPI {
	return &VMAPI{manager: manager}
}

type VMInfo struct {
	Name    string `json:"name"`
	CPUs    int    `json:"cpus"`
	RAM     string `json:"ram"`
	Android string `json:"android"`
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