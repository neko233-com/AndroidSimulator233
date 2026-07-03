package main

import (
	"context"
	"path/filepath"

	"github.com/neko233/AndroidSimulator233/internal/adb"
	"github.com/neko233/AndroidSimulator233/internal/api"
	"github.com/neko233/AndroidSimulator233/internal/vm"
)

type App struct {
	ctx     context.Context
	vmAPI   *api.VMAPI
	fileAPI *api.FileAPI
	logAPI  *api.LogAPI
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

	adbClient := adb.NewClient("adb")
	a.fileAPI = api.NewFileAPI(adbClient)
	a.logAPI = api.NewLogAPI(adbClient)
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

func (a *App) ListFiles(deviceID, path string) ([]api.FileEntry, error) {
	return a.fileAPI.ListFiles(deviceID, path)
}

func (a *App) UploadFile(deviceID, localPath, remotePath string) error {
	return a.fileAPI.UploadFile(deviceID, localPath, remotePath)
}

func (a *App) DownloadFile(deviceID, remotePath, localPath string) error {
	return a.fileAPI.DownloadFile(deviceID, remotePath, localPath)
}

func (a *App) GetLogs(deviceID, filter string) ([]api.LogEntry, error) {
	return a.logAPI.GetLogs(deviceID, filter)
}

func (a *App) StreamLogs(deviceID, filter string) (<-chan api.LogEntry, error) {
	return a.logAPI.StreamLogs(deviceID, filter)
}