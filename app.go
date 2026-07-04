package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"sync"

	"github.com/neko233/AndroidSimulator233/internal/adb"
	"github.com/neko233/AndroidSimulator233/internal/api"
	"github.com/neko233/AndroidSimulator233/internal/vm"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type App struct {
	ctx        context.Context
	mu         sync.Mutex
	vmAPI      *api.VMAPI
	fileAPI    *api.FileAPI
	logAPI     *api.LogAPI
	imageMgr   *vm.ImageManager
	downloader *vm.ImageDownloader
}

func NewApp() *App {
	return &App{}
}

func (a *App) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	return a.init(ctx)
}

func (a *App) ServiceShutdown() error {
	return nil
}

func (a *App) startup(ctx context.Context) {
	if err := a.init(ctx); err != nil {
		log.Fatal(err)
	}
}

func (a *App) shutdown(ctx context.Context) {
}

func (a *App) init(ctx context.Context) error {
	a.ctx = ctx

	userDataDir := defaultUserDataDir()
	if ctxUserDataDir, ok := ctx.Value("userDataDir").(string); ok && ctxUserDataDir != "" {
		userDataDir = ctxUserDataDir
	}

	dataDir := filepath.Join(userDataDir, "vms")
	imageDir := filepath.Join(userDataDir, "images")

	// Initialize managers
	mgr, err := vm.NewVMManager(dataDir)
	if err != nil {
		return fmt.Errorf("create VM manager: %w", err)
	}
	if err := mgr.EnsureDefault(); err != nil {
		log.Printf("failed to ensure default VM: %v", err)
	}

	a.imageMgr = vm.NewImageManager(imageDir)
	a.downloader = vm.NewImageDownloader(imageDir)

	a.vmAPI = api.NewVMAPI(mgr, a.imageMgr)

	adbClient := adb.NewClient("adb")
	a.fileAPI = api.NewFileAPI(adbClient)
	a.logAPI = api.NewLogAPI(adbClient)

	log.Printf("services initialized; dataDir=%s imageDir=%s", dataDir, imageDir)
	return nil
}

func (a *App) ensureReady() error {
	if a.vmAPI != nil && a.fileAPI != nil && a.logAPI != nil {
		return nil
	}

	a.mu.Lock()
	defer a.mu.Unlock()
	if a.vmAPI != nil && a.fileAPI != nil && a.logAPI != nil {
		return nil
	}
	return a.init(context.Background())
}

func defaultUserDataDir() string {
	configDir, err := os.UserConfigDir()
	if err != nil || configDir == "" {
		return filepath.Join(".", "data")
	}
	return filepath.Join(configDir, "AndroidSimulator233")
}

// Wails bindings - delegate to API
func (a *App) ListVMs() []api.VMInfo {
	if err := a.ensureReady(); err != nil {
		log.Printf("ListVMs initialization failed: %v", err)
		return nil
	}
	return a.vmAPI.ListVMs()
}

func (a *App) CreateVM(name, android string) (*api.VMInfo, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return a.vmAPI.CreateVM(name, android)
}

func (a *App) CreateVMWithConfig(name, android string, cpus int, ram, resolution string, dpi int, performance, renderer string, maxFPS int, root bool, phoneBrand, phoneModel string) (*api.VMInfo, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return a.vmAPI.CreateVMWithConfig(api.CreateVMRequest{
		Name:        name,
		Android:     android,
		CPUs:        cpus,
		RAM:         ram,
		Resolution:  resolution,
		DPI:         dpi,
		Performance: performance,
		Renderer:    renderer,
		MaxFPS:      maxFPS,
		Root:        root,
		PhoneBrand:  phoneBrand,
		PhoneModel:  phoneModel,
	})
}

func (a *App) UpdateVMConfig(name, android string, cpus int, ram, resolution string, dpi int, performance, renderer string, maxFPS int, root bool, phoneBrand, phoneModel string) (*api.VMInfo, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return a.vmAPI.UpdateVMConfig(name, api.CreateVMRequest{
		Android:     android,
		CPUs:        cpus,
		RAM:         ram,
		Resolution:  resolution,
		DPI:         dpi,
		Performance: performance,
		Renderer:    renderer,
		MaxFPS:      maxFPS,
		Root:        root,
		PhoneBrand:  phoneBrand,
		PhoneModel:  phoneModel,
	})
}

func (a *App) DeleteVM(name string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	return a.vmAPI.DeleteVM(name)
}

func (a *App) StartVM(name string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	return a.vmAPI.StartVM(name)
}

func (a *App) StopVM(name string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	return a.vmAPI.StopVM(name)
}

func (a *App) ResetVM(name string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	return a.vmAPI.ResetVM(name)
}

func (a *App) ScreenshotVM(name, path string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	return a.vmAPI.ScreenshotVM(name, path)
}

func (a *App) ListFiles(deviceID, path string) ([]api.FileEntry, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return a.fileAPI.ListFiles(deviceID, path)
}

func (a *App) UploadFile(deviceID, localPath, remotePath string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	return a.fileAPI.UploadFile(deviceID, localPath, remotePath)
}

func (a *App) DownloadFile(deviceID, remotePath, localPath string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	return a.fileAPI.DownloadFile(deviceID, remotePath, localPath)
}

func (a *App) GetLogs(deviceID, filter string) ([]api.LogEntry, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return a.logAPI.GetLogs(deviceID, filter)
}

func (a *App) StreamLogs(deviceID, filter string) (<-chan api.LogEntry, error) {
	if err := a.ensureReady(); err != nil {
		return nil, err
	}
	return a.logAPI.StreamLogs(deviceID, filter)
}

func (a *App) Execute(deviceID, command string) (string, error) {
	if err := a.ensureReady(); err != nil {
		return "", err
	}
	return a.vmAPI.Execute(deviceID, command)
}

func (a *App) GetDefaultApps() []string {
	if err := a.ensureReady(); err != nil {
		log.Printf("GetDefaultApps initialization failed: %v", err)
		return nil
	}
	return a.vmAPI.GetDefaultApps()
}

func (a *App) DownloadImage(version string) error {
	if err := a.ensureReady(); err != nil {
		return err
	}
	_, err := a.downloader.EnsureImage(version)
	return err
}

func (a *App) GetAvailableImages() []api.ImageInfo {
	if err := a.ensureReady(); err != nil {
		log.Printf("GetAvailableImages initialization failed: %v", err)
		return nil
	}
	return a.vmAPI.GetAvailableImages()
}

func (a *App) EnsureImageReady(version string) (string, error) {
	if err := a.ensureReady(); err != nil {
		return "", err
	}
	return a.downloader.EnsureImage(version)
}

func (a *App) GetAppLogPath() string {
	return appLogPath
}

func (a *App) GetAppLogs(maxBytes int) (string, error) {
	if appLogPath == "" {
		return "", nil
	}
	if maxBytes <= 0 {
		maxBytes = 64 * 1024
	}

	file, err := os.Open(appLogPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return "", nil
		}
		return "", err
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil {
		return "", err
	}

	offset := info.Size() - int64(maxBytes)
	if offset < 0 {
		offset = 0
	}
	if _, err := file.Seek(offset, io.SeekStart); err != nil {
		return "", err
	}
	data, err := io.ReadAll(file)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
