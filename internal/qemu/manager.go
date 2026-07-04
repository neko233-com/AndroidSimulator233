package qemu

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

type QEMUInstance struct {
	ID      string
	Config  *QEMUConfig
	Status  string // "stopped", "starting", "running", "stopping", "error"
	Process *os.Process
	qmp     *QMPClient
	mu      sync.Mutex
}

type Manager struct {
	instances map[string]*QEMUInstance
	dataDir   string
	mu        sync.RWMutex
	nextID    int
}

func NewManager(dataDir string) *Manager {
	return &Manager{
		instances: make(map[string]*QEMUInstance),
		dataDir:   dataDir,
		nextID:    1,
	}
}

func (m *Manager) Create(config *QEMUConfig) (*QEMUInstance, error) {
	id := fmt.Sprintf("vm-%d", m.nextID)
	return m.CreateWithID(id, config)
}

func (m *Manager) CreateWithID(id string, config *QEMUConfig) (*QEMUInstance, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if existing, ok := m.instances[id]; ok {
		return existing, nil
	}

	instance := &QEMUInstance{
		ID:     id,
		Config: config,
		Status: "stopped",
	}

	m.instances[id] = instance
	m.nextID++
	return instance, nil
}

func (m *Manager) Get(id string) (*QEMUInstance, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	instance, ok := m.instances[id]
	return instance, ok
}

func (m *Manager) List() []*QEMUInstance {
	m.mu.RLock()
	defer m.mu.RUnlock()

	list := make([]*QEMUInstance, 0, len(m.instances))
	for _, inst := range m.instances {
		list = append(list, inst)
	}
	return list
}

func (m *Manager) Delete(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	instance, ok := m.instances[id]
	if !ok {
		return fmt.Errorf("instance %s not found", id)
	}

	if instance.Status == "running" {
		instance.Stop()
	}

	delete(m.instances, id)
	return nil
}

func (i *QEMUInstance) Start() error {
	i.mu.Lock()
	defer i.mu.Unlock()

	if i.Status == "running" {
		return fmt.Errorf("instance %s already running", i.ID)
	}

	if i.Config.UseSDKEmulator || !fileExists(i.Config.Disk) {
		return i.startAndroidSDKEmulator()
	}

	// Resolve QEMU binary
	qemuPath, err := ResolveQEMUPath()
	if err != nil {
		return fmt.Errorf("failed to resolve QEMU path: %w", err)
	}

	// Build QEMU arguments
	args := i.Config.BuildArgs()

	var qmpSocket string
	if runtime.GOOS != "windows" {
		qmpSocket = filepath.Join(os.TempDir(), fmt.Sprintf("qmp-%s.sock", i.ID))
		args = append(args, "-qmp", fmt.Sprintf("unix:%s,server,nowait", qmpSocket))
	}

	i.Status = "starting"

	// Launch QEMU process
	cmd := exec.Command(qemuPath, args...)
	stdout, stderr, err := i.openLogFiles()
	if err != nil {
		i.Status = "error"
		return err
	}
	defer func() {
		if err != nil {
			stdout.Close()
			stderr.Close()
		}
	}()
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	cmd.SysProcAttr = processAttributes()

	if err = cmd.Start(); err != nil {
		i.Status = "error"
		return fmt.Errorf("failed to start QEMU: %w", err)
	}

	i.Process = cmd.Process
	if runtime.GOOS == "windows" {
		i.Status = "running"
	}

	if runtime.GOOS != "windows" {
		// Wait for QMP socket to be ready
		go func() {
			time.Sleep(2 * time.Second)

			// Connect QMP
			qmp := NewQMPClient(qmpSocket)
			if err := qmp.Connect(); err != nil {
				i.mu.Lock()
				i.Status = "error"
				i.mu.Unlock()
				return
			}

			i.mu.Lock()
			i.qmp = qmp
			i.Status = "running"
			i.mu.Unlock()
		}()
	}

	// Monitor process exit
	go func() {
		err := cmd.Wait()
		stdout.Close()
		stderr.Close()
		i.mu.Lock()
		defer i.mu.Unlock()

		if i.qmp != nil {
			i.qmp.Close()
			i.qmp = nil
		}

		if err != nil && i.Status != "stopping" {
			i.Status = "error"
		} else {
			i.Status = "stopped"
		}
		i.Process = nil
	}()

	return nil
}

func (i *QEMUInstance) startAndroidSDKEmulator() error {
	emulatorPath, err := ResolveAndroidEmulatorPath()
	if err != nil {
		i.Status = "error"
		return err
	}

	avdName := defaultString(i.Config.AVDName, SDKAVDName(i.Config.Name))
	if !androidAVDExists(avdName) {
		i.Status = "error"
		return fmt.Errorf("Android runtime image is missing for %s. Create SDK AVD %q with an Android system image before starting the VM", i.Config.Name, avdName)
	}

	width, height := parseResolution(i.Config.Resolution)
	if width == "" || height == "" {
		width, height = "1280", "720"
	}

	args := []string{
		"-avd", avdName,
		"-memory", ramToMB(i.Config.RAM),
		"-cores", strconv.Itoa(maxInt(i.Config.CPUs, 1)),
		"-skin", width + "x" + height,
		"-no-snapshot-load",
	}
	if i.Config.ADBPort > 0 {
		consolePort := i.Config.ADBPort - 1
		if consolePort%2 != 0 {
			consolePort--
		}
		if consolePort < 5554 {
			consolePort = 5554
		}
		args = append(args, "-ports", fmt.Sprintf("%d,%d", consolePort, consolePort+1))
	}

	stdout, stderr, err := i.openLogFiles()
	if err != nil {
		i.Status = "error"
		return err
	}
	defer func() {
		if err != nil {
			stdout.Close()
			stderr.Close()
		}
	}()

	i.Status = "starting"
	cmd := exec.Command(emulatorPath, args...)
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	cmd.SysProcAttr = processAttributes()
	if err = cmd.Start(); err != nil {
		i.Status = "error"
		return fmt.Errorf("failed to start Android emulator: %w", err)
	}

	i.Process = cmd.Process
	i.Status = "running"

	go func() {
		err := cmd.Wait()
		stdout.Close()
		stderr.Close()
		i.mu.Lock()
		defer i.mu.Unlock()
		if err != nil && i.Status != "stopping" {
			i.Status = "error"
		} else {
			i.Status = "stopped"
		}
		i.Process = nil
	}()

	return nil
}

func (i *QEMUInstance) Stop() error {
	i.mu.Lock()
	defer i.mu.Unlock()

	if i.Process == nil || i.Status == "stopped" {
		return fmt.Errorf("instance %s not running", i.ID)
	}

	i.Status = "stopping"

	// Try QMP quit first
	if i.qmp != nil {
		if err := i.qmp.Quit(); err == nil {
			// QMP quit succeeded, wait for process to exit
			go func() {
				time.Sleep(1 * time.Second)
				i.mu.Lock()
				if i.Process != nil {
					i.Process.Kill()
				}
				i.mu.Unlock()
			}()
			return nil
		}
	}

	// Fallback: kill process directly
	if i.Process != nil {
		if err := i.Process.Kill(); err != nil {
			return fmt.Errorf("failed to kill QEMU process: %w", err)
		}
	}

	return nil
}

func (i *QEMUInstance) openLogFiles() (*os.File, *os.File, error) {
	baseDir := os.TempDir()
	if i.Config != nil && i.Config.Disk != "" {
		baseDir = filepath.Dir(i.Config.Disk)
	}
	if i.Config != nil && i.Config.LogDir != "" {
		baseDir = i.Config.LogDir
	}
	logDir := baseDir
	if filepath.Base(logDir) != "logs" {
		logDir = filepath.Join(baseDir, "logs")
	}
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return nil, nil, fmt.Errorf("failed to create QEMU log dir: %w", err)
	}

	stdout, err := os.OpenFile(filepath.Join(logDir, i.ID+".out.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to open QEMU stdout log: %w", err)
	}
	stderr, err := os.OpenFile(filepath.Join(logDir, i.ID+".err.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		stdout.Close()
		return nil, nil, fmt.Errorf("failed to open QEMU stderr log: %w", err)
	}
	return stdout, stderr, nil
}

func (i *QEMUInstance) Reset() error {
	i.mu.Lock()
	defer i.mu.Unlock()

	if i.qmp != nil {
		_, err := i.qmp.Execute("system_reset", nil)
		return err
	}

	return fmt.Errorf("QMP not connected")
}

func (i *QEMUInstance) Screenshot(path string) error {
	i.mu.Lock()
	defer i.mu.Unlock()

	if i.qmp != nil {
		return i.qmp.Screenshot(path)
	}

	return fmt.Errorf("QMP not connected")
}

func (i *QEMUInstance) GetStatus() string {
	i.mu.Lock()
	defer i.mu.Unlock()
	return i.Status
}

func (i *QEMUInstance) IsRunning() bool {
	i.mu.Lock()
	defer i.mu.Unlock()
	return i.Status == "running"
}

func fileExists(path string) bool {
	if path == "" {
		return false
	}
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

func SDKAVDName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		name = "Android"
	}
	var builder strings.Builder
	for _, r := range name {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z', r >= '0' && r <= '9':
			builder.WriteRune(r)
		default:
			builder.WriteByte('_')
		}
	}
	return "AndroidSimulator233_" + strings.Trim(builder.String(), "_")
}

func androidAVDExists(name string) bool {
	home, err := os.UserHomeDir()
	if err != nil {
		return false
	}
	avdDir := filepath.Join(home, ".android", "avd")
	return fileExists(filepath.Join(avdDir, name+".ini")) || dirExists(filepath.Join(avdDir, name+".avd"))
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func parseResolution(value string) (string, string) {
	fields := strings.Split(strings.ToLower(value), "x")
	if len(fields) != 2 {
		return "", ""
	}
	width := strings.TrimSpace(fields[0])
	height := strings.TrimSpace(fields[1])
	if _, err := strconv.Atoi(width); err != nil {
		return "", ""
	}
	if _, err := strconv.Atoi(height); err != nil {
		return "", ""
	}
	return width, height
}

func ramToMB(value string) string {
	value = strings.TrimSpace(strings.ToUpper(value))
	if strings.HasSuffix(value, "G") {
		number := strings.TrimSuffix(value, "G")
		if gb, err := strconv.Atoi(number); err == nil {
			return strconv.Itoa(gb * 1024)
		}
	}
	if strings.HasSuffix(value, "M") {
		number := strings.TrimSuffix(value, "M")
		if mb, err := strconv.Atoi(number); err == nil {
			return strconv.Itoa(mb)
		}
	}
	if _, err := strconv.Atoi(value); err == nil && value != "" {
		return value
	}
	return "2048"
}

func maxInt(value, fallback int) int {
	if value < fallback {
		return fallback
	}
	return value
}
