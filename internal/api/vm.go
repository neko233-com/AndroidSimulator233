package api

import (
	"fmt"

	"github.com/neko233/AndroidSimulator233/internal/adb"
	"github.com/neko233/AndroidSimulator233/internal/vm"
)

type VMAPI struct {
	manager      *vm.VMManager
	imageManager *vm.ImageManager
	adb          *adb.Client
}

func NewVMAPI(manager *vm.VMManager, imageManager *vm.ImageManager) *VMAPI {
	return &VMAPI{
		manager:      manager,
		imageManager: imageManager,
		adb:          adb.NewClient("adb"),
	}
}

type VMInfo struct {
	Name        string `json:"name"`
	CPUs        int    `json:"cpus"`
	RAM         string `json:"ram"`
	Android     string `json:"android"`
	Resolution  string `json:"resolution,omitempty"`
	DPI         int    `json:"dpi,omitempty"`
	Performance string `json:"performance,omitempty"`
	Renderer    string `json:"renderer,omitempty"`
	MaxFPS      int    `json:"maxFps,omitempty"`
	Root        bool   `json:"root,omitempty"`
	PhoneBrand  string `json:"phoneBrand,omitempty"`
	PhoneModel  string `json:"phoneModel,omitempty"`
	Status      string `json:"status,omitempty"`
	ADBPort     int    `json:"adbPort,omitempty"`
	VNCPort     int    `json:"vncPort,omitempty"`
}

type ImageInfo struct {
	Version    string `json:"version"`
	Downloaded bool   `json:"downloaded"`
	Size       int64  `json:"size"`
}

type CreateVMRequest struct {
	Name        string `json:"name"`
	Android     string `json:"android"`
	CPUs        int    `json:"cpus"`
	RAM         string `json:"ram"`
	Resolution  string `json:"resolution"`
	DPI         int    `json:"dpi"`
	Performance string `json:"performance"`
	Renderer    string `json:"renderer"`
	MaxFPS      int    `json:"maxFps"`
	Root        bool   `json:"root"`
	PhoneBrand  string `json:"phoneBrand"`
	PhoneModel  string `json:"phoneModel"`
}

func (a *VMAPI) ListVMs() []VMInfo {
	vms := a.manager.List()
	result := make([]VMInfo, len(vms))
	for i, vm := range vms {
		result[i] = VMInfo{
			Name:        vm.Name,
			CPUs:        vm.CPUs,
			RAM:         vm.RAM,
			Android:     vm.Android,
			Resolution:  vm.Resolution,
			DPI:         vm.DPI,
			Performance: vm.Performance,
			Renderer:    vm.Renderer,
			MaxFPS:      vm.MaxFPS,
			Root:        vm.Root,
			PhoneBrand:  vm.PhoneBrand,
			PhoneModel:  vm.PhoneModel,
			Status:      a.manager.Status(vm.Name),
			ADBPort:     vm.ADBPort,
			VNCPort:     vm.VNCPort,
		}
	}
	return result
}

func (a *VMAPI) CreateVM(name, android string) (*VMInfo, error) {
	return a.CreateVMWithConfig(CreateVMRequest{Name: name, Android: android})
}

func (a *VMAPI) CreateVMWithConfig(request CreateVMRequest) (*VMInfo, error) {
	config, err := a.manager.CreateWithOptions(vm.CreateOptions{
		Name:        request.Name,
		Android:     request.Android,
		CPUs:        request.CPUs,
		RAM:         request.RAM,
		Resolution:  request.Resolution,
		DPI:         request.DPI,
		Performance: request.Performance,
		Renderer:    request.Renderer,
		MaxFPS:      request.MaxFPS,
		Root:        request.Root,
		PhoneBrand:  request.PhoneBrand,
		PhoneModel:  request.PhoneModel,
	})
	if err != nil {
		return nil, err
	}
	return &VMInfo{
		Name:        config.Name,
		CPUs:        config.CPUs,
		RAM:         config.RAM,
		Android:     config.Android,
		Resolution:  config.Resolution,
		DPI:         config.DPI,
		Performance: config.Performance,
		Renderer:    config.Renderer,
		MaxFPS:      config.MaxFPS,
		Root:        config.Root,
		PhoneBrand:  config.PhoneBrand,
		PhoneModel:  config.PhoneModel,
		Status:      "stopped",
		ADBPort:     config.ADBPort,
		VNCPort:     config.VNCPort,
	}, nil
}

func (a *VMAPI) UpdateVMConfig(name string, request CreateVMRequest) (*VMInfo, error) {
	config, err := a.manager.UpdateWithOptions(name, vm.CreateOptions{
		Android:     request.Android,
		CPUs:        request.CPUs,
		RAM:         request.RAM,
		Resolution:  request.Resolution,
		DPI:         request.DPI,
		Performance: request.Performance,
		Renderer:    request.Renderer,
		MaxFPS:      request.MaxFPS,
		Root:        request.Root,
		PhoneBrand:  request.PhoneBrand,
		PhoneModel:  request.PhoneModel,
	})
	if err != nil {
		return nil, err
	}
	return &VMInfo{
		Name:        config.Name,
		CPUs:        config.CPUs,
		RAM:         config.RAM,
		Android:     config.Android,
		Resolution:  config.Resolution,
		DPI:         config.DPI,
		Performance: config.Performance,
		Renderer:    config.Renderer,
		MaxFPS:      config.MaxFPS,
		Root:        config.Root,
		PhoneBrand:  config.PhoneBrand,
		PhoneModel:  config.PhoneModel,
		Status:      a.manager.Status(config.Name),
		ADBPort:     config.ADBPort,
		VNCPort:     config.VNCPort,
	}, nil
}

func (a *VMAPI) DeleteVM(name string) error {
	return a.manager.Delete(name)
}

func (a *VMAPI) RenameVM(oldName, newName string) (*VMInfo, error) {
	config, err := a.manager.Rename(oldName, newName)
	if err != nil {
		return nil, err
	}
	return a.configToInfo(config), nil
}

func (a *VMAPI) CloneVM(sourceName, newName string) (*VMInfo, error) {
	config, err := a.manager.Clone(sourceName, newName)
	if err != nil {
		return nil, err
	}
	return a.configToInfo(config), nil
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

func (a *VMAPI) GetAvailableImages() []ImageInfo {
	images := a.imageManager.ListAvailable()
	result := make([]ImageInfo, len(images))
	for i, img := range images {
		result[i] = ImageInfo{
			Version:    img.Version,
			Downloaded: img.Downloaded,
			Size:       img.Size,
		}
	}
	return result
}

func (a *VMAPI) configToInfo(config *vm.VMConfig) *VMInfo {
	return &VMInfo{
		Name:        config.Name,
		CPUs:        config.CPUs,
		RAM:         config.RAM,
		Android:     config.Android,
		Resolution:  config.Resolution,
		DPI:         config.DPI,
		Performance: config.Performance,
		Renderer:    config.Renderer,
		MaxFPS:      config.MaxFPS,
		Root:        config.Root,
		PhoneBrand:  config.PhoneBrand,
		PhoneModel:  config.PhoneModel,
		Status:      a.manager.Status(config.Name),
		ADBPort:     config.ADBPort,
		VNCPort:     config.VNCPort,
	}
}
