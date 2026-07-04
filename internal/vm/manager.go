package vm

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/neko233/AndroidSimulator233/internal/qemu"
)

type VMManager struct {
	dataDir string
	vms     map[string]*VMConfig
	qemu    *qemu.Manager
	mu      sync.RWMutex
}

const DefaultVMName = "Android 15"

type CreateOptions struct {
	Name        string
	Android     string
	CPUs        int
	RAM         string
	Resolution  string
	DPI         int
	Performance string
	Renderer    string
	MaxFPS      int
	Root        bool
	PhoneBrand  string
	PhoneModel  string
}

func NewVMManager(dataDir string) (*VMManager, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data dir: %w", err)
	}

	mgr := &VMManager{
		dataDir: dataDir,
		vms:     make(map[string]*VMConfig),
		qemu:    qemu.NewManager(dataDir),
	}

	if err := mgr.loadAll(); err != nil {
		return nil, err
	}

	return mgr, nil
}

func (m *VMManager) EnsureDefault() error {
	if len(m.List()) > 0 {
		return nil
	}
	_, err := m.CreateWithOptions(CreateOptions{Name: DefaultVMName})
	return err
}

func (m *VMManager) loadAll() error {
	entries, err := os.ReadDir(m.dataDir)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if filepath.Ext(entry.Name()) != ".json" {
			continue
		}

		config := &VMConfig{}
		path := filepath.Join(m.dataDir, entry.Name())
		if err := config.Load(path); err != nil {
			continue
		}
		m.normalizeLoadedConfig(config)

		m.vms[entry.Name()] = config
	}

	return nil
}

func (m *VMManager) Create(name, android string) (*VMConfig, error) {
	return m.CreateWithOptions(CreateOptions{Name: name, Android: android})
}

func (m *VMManager) CreateWithOptions(options CreateOptions) (*VMConfig, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	name, err := normalizeName(options.Name)
	if err != nil {
		return nil, err
	}
	if _, exists := m.vms[name+".json"]; exists {
		return nil, fmt.Errorf("VM %s already exists", name)
	}

	// Default to Android 15 if not specified
	android := options.Android
	if android == "" {
		android = DefaultImage
	}
	cpus := options.CPUs
	if cpus <= 0 {
		cpus = 2
	}
	if cpus > 16 {
		cpus = 16
	}
	ram := options.RAM
	if ram == "" {
		ram = "2G"
	}
	resolution := options.Resolution
	if resolution == "" {
		resolution = "1280x720"
	}
	dpi := options.DPI
	if dpi <= 0 {
		dpi = 240
	}
	performance := options.Performance
	if performance == "" {
		performance = "middle"
	}
	renderer := options.Renderer
	if renderer == "" {
		renderer = "vulkan"
	}
	maxFPS := options.MaxFPS
	if maxFPS <= 0 {
		maxFPS = 60
	}
	phoneBrand := options.PhoneBrand
	if phoneBrand == "" {
		phoneBrand = "Xiaomi"
	}
	phoneModel := options.PhoneModel
	if phoneModel == "" {
		phoneModel = "14 Ultra"
	}

	_, vncPort, adbPort := m.allocatePorts()
	config := &VMConfig{
		Name:        name,
		CPUs:        cpus,
		RAM:         ram,
		Android:     android,
		Resolution:  resolution,
		DPI:         dpi,
		Performance: performance,
		Renderer:    renderer,
		MaxFPS:      maxFPS,
		Root:        options.Root,
		PhoneBrand:  phoneBrand,
		PhoneModel:  phoneModel,
		Disk:        filepath.Join(m.dataDir, name+".qcow2"),
		Display:     "window",
		ADBPort:     adbPort,
		VNCPort:     vncPort,
		GPU:         "virtio",
		Network:     "user",
		FirstBoot:   true,
		SetupStatus: "pending",
	}

	path := filepath.Join(m.dataDir, name+".json")
	if err := config.Save(path); err != nil {
		return nil, err
	}

	m.vms[name+".json"] = config
	return config, nil
}

func (m *VMManager) UpdateWithOptions(name string, options CreateOptions) (*VMConfig, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	config, ok := m.vms[name+".json"]
	if !ok {
		return nil, fmt.Errorf("VM %s not found", name)
	}

	if options.Android != "" {
		config.Android = options.Android
	}
	if options.CPUs > 0 {
		config.CPUs = options.CPUs
	}
	if config.CPUs > 16 {
		config.CPUs = 16
	}
	if options.RAM != "" {
		config.RAM = options.RAM
	}
	if options.Resolution != "" {
		config.Resolution = options.Resolution
	}
	if options.DPI > 0 {
		config.DPI = options.DPI
	}
	if options.Performance != "" {
		config.Performance = options.Performance
	}
	if options.Renderer != "" {
		config.Renderer = options.Renderer
	}
	if options.MaxFPS > 0 {
		config.MaxFPS = options.MaxFPS
	}
	config.Root = options.Root
	if options.PhoneBrand != "" {
		config.PhoneBrand = options.PhoneBrand
	}
	if options.PhoneModel != "" {
		config.PhoneModel = options.PhoneModel
	}
	if config.Display == "" || strings.HasPrefix(config.Display, "vnc=") {
		config.Display = "window"
	}
	if config.GPU == "" {
		config.GPU = "virtio"
	}
	if config.Network == "" {
		config.Network = "user"
	}

	path := filepath.Join(m.dataDir, name+".json")
	if err := config.Save(path); err != nil {
		return nil, err
	}
	return config, nil
}

func (m *VMManager) Get(name string) (*VMConfig, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	config, ok := m.vms[name+".json"]
	return config, ok
}

func (m *VMManager) List() []*VMConfig {
	m.mu.RLock()
	defer m.mu.RUnlock()

	list := make([]*VMConfig, 0, len(m.vms))
	for _, config := range m.vms {
		list = append(list, config)
	}
	sort.Slice(list, func(i, j int) bool {
		return list[i].Name < list[j].Name
	})
	return list
}

func (m *VMManager) Delete(name string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Stop VM if running
	if inst, ok := m.qemu.Get(name); ok {
		if inst.IsRunning() {
			inst.Stop()
		}
	}

	path := filepath.Join(m.dataDir, name+".json")
	if err := os.Remove(path); err != nil {
		return err
	}

	delete(m.vms, name+".json")
	return nil
}

func (m *VMManager) StartVM(name string, config *VMConfig) error {
	m.normalizeLoadedConfig(config)

	if config.ADBPort == 0 || config.VNCPort == 0 || config.Display == "" || strings.HasPrefix(config.Display, "vnc=") || config.Disk == "" {
		m.mu.Lock()
		if config.ADBPort == 0 || config.VNCPort == 0 || config.Display == "" || strings.HasPrefix(config.Display, "vnc=") || config.Disk == "" {
			_, vncPort, adbPort := m.allocatePorts()
			if config.ADBPort == 0 {
				config.ADBPort = adbPort
			}
			if config.VNCPort == 0 {
				config.VNCPort = vncPort
			}
			if config.Display == "" || strings.HasPrefix(config.Display, "vnc=") {
				config.Display = "window"
			}
			if config.Disk == "" {
				config.Disk = filepath.Join(m.dataDir, name+".qcow2")
			}
			_ = config.Save(filepath.Join(m.dataDir, name+".json"))
		}
		m.mu.Unlock()
	}

	useSDKEmulator := false
	if _, err := os.Stat(config.Disk); err != nil {
		useSDKEmulator = true
	}
	m.appendRuntimeLog("starting %s cpus=%d ram=%s resolution=%s adb=%d sdk=%t", name, config.CPUs, config.RAM, config.Resolution, config.ADBPort, useSDKEmulator)

	// Create QEMU config
	qemuConfig := &qemu.QEMUConfig{
		Name:           config.Name,
		CPUs:           config.CPUs,
		RAM:            config.RAM,
		Disk:           config.Disk,
		Display:        config.Display,
		Resolution:     config.Resolution,
		GPU:            config.GPU,
		Network:        config.Network,
		ADBPort:        config.ADBPort,
		KVM:            true,
		UseSDKEmulator: useSDKEmulator,
		AVDName:        qemu.SDKAVDName(config.Name),
		LogDir:         filepath.Join(m.dataDir, "logs"),
	}

	// Create QEMU instance
	instance, err := m.qemu.CreateWithID(name, qemuConfig)
	if err != nil {
		return fmt.Errorf("failed to create QEMU instance: %w", err)
	}

	// Start the instance
	if err := instance.Start(); err != nil {
		m.appendRuntimeLog("start failed %s: %v", name, err)
		return err
	}
	m.appendRuntimeLog("started %s status=%s", name, instance.GetStatus())
	return nil
}

func (m *VMManager) StopVM(name string) error {
	inst, ok := m.qemu.Get(name)
	if ok {
		return inst.Stop()
	}
	return fmt.Errorf("VM %s not running", name)
}

func (m *VMManager) ResetVM(name string) error {
	inst, ok := m.qemu.Get(name)
	if ok {
		return inst.Reset()
	}
	return fmt.Errorf("VM %s not running", name)
}

func (m *VMManager) ScreenshotVM(name, path string) error {
	inst, ok := m.qemu.Get(name)
	if !ok {
		return fmt.Errorf("VM %s not found", name)
	}
	return inst.Screenshot(path)
}

func (m *VMManager) Status(name string) string {
	inst, ok := m.qemu.Get(name)
	if !ok {
		return "stopped"
	}
	return inst.GetStatus()
}

func (m *VMManager) allocatePorts() (vncDisplay int, vncPort int, adbPort int) {
	usedVNC := map[int]bool{}
	usedADB := map[int]bool{}
	for _, config := range m.vms {
		if config.VNCPort > 0 {
			usedVNC[config.VNCPort] = true
		}
		if config.ADBPort > 0 {
			usedADB[config.ADBPort] = true
		}
	}

	vncPort = 5700
	for usedVNC[vncPort] {
		vncPort++
	}
	adbPort = 5555
	for usedADB[adbPort] {
		adbPort += 2
	}
	return vncPort - 5700, vncPort, adbPort
}

var vmNamePattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._ -]{0,63}$`)

func normalizeName(name string) (string, error) {
	if !vmNamePattern.MatchString(name) {
		return "", fmt.Errorf("VM name must be 1-64 characters and may contain letters, numbers, spaces, dots, underscores, and dashes")
	}
	return name, nil
}

func (m *VMManager) normalizeLoadedConfig(config *VMConfig) {
	changed := false
	if config.Display == "" || strings.HasPrefix(config.Display, "vnc=") {
		config.Display = "window"
		changed = true
	}
	if config.Disk == "" {
		config.Disk = filepath.Join(m.dataDir, config.Name+".qcow2")
		changed = true
	}
	if config.GPU == "" {
		config.GPU = "virtio"
		changed = true
	}
	if config.Network == "" {
		config.Network = "user"
		changed = true
	}
	if changed {
		_ = config.Save(filepath.Join(m.dataDir, config.Name+".json"))
	}
}

func (m *VMManager) appendRuntimeLog(format string, args ...interface{}) {
	logDir := filepath.Join(m.dataDir, "logs")
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return
	}
	file, err := os.OpenFile(filepath.Join(logDir, "runtime.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer file.Close()
	line := fmt.Sprintf(format, args...)
	_, _ = fmt.Fprintf(file, "%s %s\n", time.Now().Format(time.RFC3339), line)
}
