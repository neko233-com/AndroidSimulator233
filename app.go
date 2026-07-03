package main

import (
	"context"
	"path/filepath"

	"github.com/neko233/AndroidSimulator233/internal/api"
	"github.com/neko233/AndroidSimulator233/internal/vm"
)

type App struct {
	ctx   context.Context
	vmAPI *api.VMAPI
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	dataDir := filepath.Join(ctx.Value("userDataDir").(string), "vms")
	mgr, err := vm.NewVMManager(dataDir)
	if err != nil {
		panic(err)
	}

	a.vmAPI = api.NewVMAPI(mgr)
}

func (a *App) shutdown(ctx context.Context) {
}

// Wails bindings - delegate to API
func (a *App) ListVMs() []api.VMInfo {
	return a.vmAPI.ListVMs()
}

func (a *App) CreateVM(name, android string) (*api.VMInfo, error) {
	return a.vmAPI.CreateVM(name, android)
}

func (a *App) DeleteVM(name string) error {
	return a.vmAPI.DeleteVM(name)
}