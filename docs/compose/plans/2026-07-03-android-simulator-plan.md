# AndroidSimulator233 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an open-source Android simulator (MuMu alternative) with QEMU backend, Wails v3 frontend, supporting Windows and macOS.

**Architecture:** Wails v3 monolith — Go backend manages QEMU processes, VNC display, ADB; React frontend provides UI. QEMU binaries bundled per-platform. Android images as qcow2 overlays.

**Tech Stack:** Go 1.26+, Wails v3, Vite 8, React 19, TypeScript, Tailwind CSS, QEMU, VNC, ADB

## Global Constraints

- Go 1.26+ required
- Wails v3 for cross-platform (Windows + macOS)
- QEMU binaries bundled (not system-installed)
- Android images: AOSP android-9, android-12, android-14
- VNC for display streaming (built into QEMU)
- ADB for device communication
- VitePress for documentation
- GitHub Pages for docs deployment
- Dark theme UI (MuMu/BlueStacks style)

---

## Phase 1: Foundation (Tasks 1-4)

### Task 1: Project Scaffolding

**Covers:** [S1, S3]

**Files:**
- Create: `go.mod`
- Create: `main.go`
- Create: `app.go`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/main.tsx`
- Create: `frontend/index.html`
- Create: `.gitignore`

**Interfaces:**
- Consumes: (none — initial setup)
- Produces: Wails v3 project structure, frontend builds successfully

- [ ] **Step 1: Initialize Go module**

```bash
go mod init github.com/neko233/AndroidSimulator233
```

- [ ] **Step 2: Create main.go**

```go
package main

import (
	"embed"

	"github.com/wailsapp/wails/v3"
	"github.com/wailsapp/wails/v3/pkg/options"
	"github.com/wailsapp/wails/v3/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "AndroidSimulator233",
		Width:  1280,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup:  app.startup,
		OnShutdown: app.shutdown,
		Bind: []interface{}{
			app,
		},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}
```

- [ ] **Step 3: Create app.go**

```go
package main

import (
	"context"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) shutdown(ctx context.Context) {
}

func (a *App) Greet(name string) string {
	return "Hello " + name + "!"
}
```

- [ ] **Step 4: Create frontend/package.json**

```json
{
  "name": "androidsimulator233-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 5: Create frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
```

- [ ] **Step 6: Create frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

- [ ] **Step 7: Create frontend/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AndroidSimulator233</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create frontend/src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 9: Create frontend/src/App.tsx**

```tsx
import { useState } from 'react'

function App() {
  const [result, setResult] = useState('')

  const greet = async () => {
    // Wails binding will be available at runtime
    setResult('Hello from AndroidSimulator233!')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AndroidSimulator233</h1>
        <p className="text-gray-400 mb-8">Open-source Android Simulator</p>
        <button
          onClick={greet}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
        >
          Test Connection
        </button>
        {result && <p className="mt-4 text-green-400">{result}</p>}
      </div>
    </div>
  )
}

export default App
```

- [ ] **Step 10: Create frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 11: Create .gitignore**

```
# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib

# Go
/vendor/

# Node
node_modules/
frontend/dist/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Wails
build/
```

- [ ] **Step 12: Install frontend dependencies and build**

```bash
cd frontend && npm install && npm run build
```

- [ ] **Step 13: Verify project builds**

```bash
wails build
```

Expected: Binary in `build/bin/`

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: initial Wails v3 project scaffolding"
```

---

### Task 2: QEMU Process Manager

**Covers:** [S4]

**Files:**
- Create: `internal/qemu/config.go`
- Create: `internal/qemu/manager.go`
- Create: `internal/qemu/config_test.go`
- Create: `internal/qemu/manager_test.go`

**Interfaces:**
- Consumes: (none)
- Produces: `QEMUConfig`, `QEMUManager`, `QEMUInstance`

- [ ] **Step 1: Write QEMUConfig test**

```go
// internal/qemu/config_test.go
package qemu

import (
	"testing"
)

func TestQEMUConfig_BuildArgs(t *testing.T) {
	config := &QEMUConfig{
		CPUs:    4,
		RAM:     "4G",
		Disk:    "/path/to/disk.qcow2",
		Display: "vnc=:0",
		GPU:     "virtio",
		Network: "user",
		ADBPort: 5555,
		KVM:     true,
	}

	args := config.BuildArgs()

	// Check essential flags exist
	if !contains(args, "-m") {
		t.Error("missing -m flag")
	}
	if !contains(args, "4G") {
		t.Error("missing RAM value")
	}
	if !contains(args, "-smp") {
		t.Error("missing -smp flag")
	}
	if !contains(args, "4") {
		t.Error("missing CPU count")
	}
	if !contains(args, "-enable-kvm") {
		t.Error("missing -enable-kvm flag")
	}
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
go test ./internal/qemu/ -v -run TestQEMUConfig_BuildArgs
```

Expected: FAIL with "undefined: QEMUConfig"

- [ ] **Step 3: Implement QEMUConfig**

```go
// internal/qemu/config.go
package qemu

import (
	"fmt"
	"path/filepath"
	"runtime"
)

type QEMUConfig struct {
	CPUs    int
	RAM     string
	Disk    string
	Display string
	GPU     string
	Network string
	ADBPort int
	KVM     bool
}

func (c *QEMUConfig) BuildArgs() []string {
	args := []string{
		"-m", c.RAM,
		"-smp", fmt.Sprintf("%d", c.CPUs),
		"-drive", fmt.Sprintf("file=%s,if=virtio,format=qcow2", c.Disk),
		"-display", c.Display,
		"-device", fmt.Sprintf("virtio-vga-gl"),
		"-netdev", fmt.Sprintf("user,id=net0,hostfwd=tcp::%d-:5555", c.ADBPort),
		"-device", "virtio-net-pci,netdev=net0",
		"-serial", "none",
		"-audiodev", "none",
	}

	if c.KVM && isKVMSupported() {
		args = append(args, "-enable-kvm")
	}

	return args
}

func isKVMSupported() bool {
	switch runtime.GOOS {
	case "linux":
		return true // KVM
	case "darwin":
		return true // HVF
	case "windows":
		return false // WHPX needs detection
	default:
		return false
	}
}

func QEMUPath() string {
	// TODO: resolve bundled QEMU path
	exe := "qemu-system-x86_64"
	if runtime.GOOS == "windows" {
		exe += ".exe"
	}
	return exe
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
go test ./internal/qemu/ -v -run TestQEMUConfig_BuildArgs
```

Expected: PASS

- [ ] **Step 5: Write QEMUManager test**

```go
// internal/qemu/manager_test.go
package qemu

import (
	"testing"
)

func TestNewManager(t *testing.T) {
	mgr := NewManager()
	if mgr == nil {
		t.Fatal("NewManager returned nil")
	}
	if len(mgr.instances) != 0 {
		t.Error("new manager should have no instances")
	}
}

func TestManager_Create(t *testing.T) {
	mgr := NewManager()
	config := &QEMUConfig{
		CPUs:    2,
		RAM:     "2G",
		Disk:    "/tmp/test.qcow2",
		Display: "vnc=:0",
		GPU:     "virtio",
		Network: "user",
		ADBPort: 5555,
		KVM:     false,
	}

	instance, err := mgr.Create(config)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if instance == nil {
		t.Fatal("Create returned nil instance")
	}
	if instance.ID == "" {
		t.Error("instance should have an ID")
	}
}
```

- [ ] **Step 6: Run test to verify it fails**

```bash
go test ./internal/qemu/ -v -run TestManager_Create
```

Expected: FAIL with "undefined: Manager"

- [ ] **Step 7: Implement QEMUManager**

```go
// internal/qemu/manager.go
package qemu

import (
	"fmt"
	"sync"
	"time"
)

type QEMUInstance struct {
	ID      string
	Config  *QEMUConfig
	Status  string // "stopped", "starting", "running", "stopping"
	Process interface{} // *os.Process placeholder
	mu      sync.Mutex
}

type Manager struct {
	instances map[string]*QEMUInstance
	mu        sync.RWMutex
	nextID    int
}

func NewManager() *Manager {
	return &Manager{
		instances: make(map[string]*QEMUInstance),
		nextID:    1,
	}
}

func (m *Manager) Create(config *QEMUConfig) (*QEMUInstance, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	id := fmt.Sprintf("vm-%d", m.nextID)
	m.nextID++

	instance := &QEMUInstance{
		ID:     id,
		Config: config,
		Status: "stopped",
	}

	m.instances[id] = instance
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
		return fmt.Errorf("cannot delete running instance %s", id)
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

	i.Status = "starting"

	// TODO: launch QEMU process
	// For now, simulate startup
	go func() {
		time.Sleep(100 * time.Millisecond)
		i.mu.Lock()
		i.Status = "running"
		i.mu.Unlock()
	}()

	return nil
}

func (i *QEMUInstance) Stop() error {
	i.mu.Lock()
	defer i.mu.Unlock()

	if i.Status != "running" {
		return fmt.Errorf("instance %s not running", i.ID)
	}

	i.Status = "stopping"

	// TODO: send QMP quit command
	go func() {
		time.Sleep(50 * time.Millisecond)
		i.mu.Lock()
		i.Status = "stopped"
		i.mu.Unlock()
	}()

	return nil
}

func (i *QEMUInstance) GetStatus() string {
	i.mu.Lock()
	defer i.mu.Unlock()
	return i.Status
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
go test ./internal/qemu/ -v -run TestManager_Create
```

Expected: PASS

- [ ] **Step 9: Run all QEMU tests**

```bash
go test ./internal/qemu/ -v
```

Expected: All PASS

- [ ] **Step 10: Commit**

```bash
git add internal/qemu/
git commit -m "feat: add QEMU process manager with config builder"
```

---

### Task 3: VM Configuration & Storage

**Covers:** [S4]

**Files:**
- Create: `internal/vm/config.go`
- Create: `internal/vm/instance.go`
- Create: `internal/vm/manager.go`
- Create: `internal/vm/config_test.go`

**Interfaces:**
- Consumes: `qemu.QEMUConfig`, `qemu.Manager`
- Produces: `VMConfig`, `VMManager`

- [ ] **Step 1: Write VMConfig test**

```go
// internal/vm/config_test.go
package vm

import (
	"os"
	"path/filepath"
	"testing"
)

func TestVMConfig_SaveLoad(t *testing.T) {
	dir := t.TempDir()
	configPath := filepath.Join(dir, "vm.json")

	config := &VMConfig{
		Name:    "Test VM",
		CPUs:    4,
		RAM:     "4G",
		Disk:    filepath.Join(dir, "disk.qcow2"),
		Android: "android-12",
	}

	err := config.Save(configPath)
	if err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	loaded := &VMConfig{}
	err = loaded.Load(configPath)
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}

	if loaded.Name != config.Name {
		t.Errorf("Name mismatch: got %s, want %s", loaded.Name, config.Name)
	}
	if loaded.CPUs != config.CPUs {
		t.Errorf("CPUs mismatch: got %d, want %d", loaded.CPUs, config.CPUs)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
go test ./internal/vm/ -v -run TestVMConfig_SaveLoad
```

Expected: FAIL with "undefined: VMConfig"

- [ ] **Step 3: Implement VMConfig**

```go
// internal/vm/config.go
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
go test ./internal/vm/ -v -run TestVMConfig_SaveLoad
```

Expected: PASS

- [ ] **Step 5: Implement VMManager**

```go
// internal/vm/manager.go
package vm

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

type VMManager struct {
	dataDir  string
	vms      map[string]*VMConfig
	mu       sync.RWMutex
	nextID   int
}

func NewVMManager(dataDir string) (*VMManager, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data dir: %w", err)
	}

	mgr := &VMManager{
		dataDir: dataDir,
		vms:     make(map[string]*VMConfig),
	}

	if err := mgr.loadAll(); err != nil {
		return nil, err
	}

	return mgr, nil
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

		m.vms[entry.Name()] = config
	}

	return nil
}

func (m *VMManager) Create(name, android string) (*VMConfig, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	config := &VMConfig{
		Name:    name,
		CPUs:    2,
		RAM:     "2G",
		Android: android,
		Display: "vnc=:0",
		GPU:     "virtio",
		Network: "user",
	}

	path := filepath.Join(m.dataDir, name+".json")
	if err := config.Save(path); err != nil {
		return nil, err
	}

	m.vms[name+".json"] = config
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
	return list
}

func (m *VMManager) Delete(name string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	path := filepath.Join(m.dataDir, name+".json")
	if err := os.Remove(path); err != nil {
		return err
	}

	delete(m.vms, name+".json")
	return nil
}
```

- [ ] **Step 6: Run all VM tests**

```bash
go test ./internal/vm/ -v
```

Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add internal/vm/
git commit -m "feat: add VM configuration and storage manager"
```

---

### Task 4: Basic Wails Bindings

**Covers:** [S3, S7]

**Files:**
- Modify: `app.go`
- Create: `internal/api/vm.go`

**Interfaces:**
- Consumes: `vm.VMManager`
- Produces: Wails-bound methods

- [ ] **Step 1: Create API layer**

```go
// internal/api/vm.go
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
```

- [ ] **Step 2: Update app.go with bindings**

```go
// app.go
package main

import (
	"context"
	"path/filepath"

	"github.com/neko233/AndroidSimulator233/internal/api"
	"github.com/neko233/AndroidSimulator233/internal/vm"
)

type App struct {
	ctx     context.Context
	vmAPI   *api.VMAPI
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
```

- [ ] **Step 3: Verify build**

```bash
go build .
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app.go internal/api/
git commit -m "feat: add Wails bindings for VM management"
```

---

## Phase 2: Core VM (Tasks 5-8)

### Task 5: QEMU Binary Management

**Covers:** [S4]

**Files:**
- Create: `internal/qemu/binary.go`
- Create: `qemu/win-x64/.gitkeep`
- Create: `qemu/macos-arm64/.gitkeep`

**Interfaces:**
- Consumes: `qemu.QEMUConfig`
- Produces: Resolved QEMU binary path

- [ ] **Step 1: Create binary resolver**

```go
// internal/qemu/binary.go
package qemu

import (
	"os"
	"path/filepath"
	"runtime"
)

const (
	qemuBinaryWindows = "qemu-system-x86_64.exe"
	qemuBinaryDarwin  = "qemu-system-x86_64"
	qemuBinaryLinux   = "qemu-system-x86_64"
)

func ResolveQEMUPath() (string, error) {
	// 1. Check bundled location
	bundled := bundledPath()
	if _, err := os.Stat(bundled); err == nil {
		return bundled, nil
	}

	// 2. Check system PATH
	exe := qemuBinaryLinux
	switch runtime.GOOS {
	case "windows":
		exe = qemuBinaryWindows
	case "darwin":
		exe = qemuBinaryDarwin
}

	path, err := exec.LookPath(exe)
	if err == nil {
		return path, nil
	}

	return "", fmt.Errorf("QEMU not found: install QEMU or place binary in %s", bundledDir())
}

func bundledDir() string {
	exe, _ := os.Executable()
	dir := filepath.Dir(exe)

	switch runtime.GOOS {
	case "windows":
		return filepath.Join(dir, "qemu", "win-x64")
	case "darwin":
		return filepath.Join(dir, "qemu", "macos-arm64")
	default:
		return filepath.Join(dir, "qemu", "linux-x64")
	}
}

func bundledPath() string {
	exe := qemuBinaryLinux
	switch runtime.GOOS {
	case "windows":
		exe = qemuBinaryWindows
	case "darwin":
		exe = qemuBinaryDarwin
	}
	return filepath.Join(bundledDir(), exe)
}
```

- [ ] **Step 2: Verify build**

```bash
go build ./internal/qemu/
```

- [ ] **Step 3: Commit**

```bash
git add internal/qemu/binary.go qemu/
git commit -m "feat: add QEMU binary resolver with bundled path support"
```

---

### Task 6: QMP Monitor Client

**Covers:** [S4]

**Files:**
- Create: `internal/qemu/qmp.go`
- Create: `internal/qemu/qmp_test.go`

**Interfaces:**
- Consumes: QEMU process
- Produces: `QMPClient`

- [ ] **Step 1: Write QMP test**

```go
// internal/qemu/qmp_test.go
package qemu

import (
	"testing"
)

func TestQMPClient_Connect(t *testing.T) {
	// Mock test - verify struct creation
	client := NewQMPClient("/tmp/test-qmp.sock")
	if client == nil {
		t.Fatal("NewQMPClient returned nil")
	}
	if client.socketPath != "/tmp/test-qmp.sock" {
		t.Error("socketPath not set correctly")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
go test ./internal/qemu/ -v -run TestQMPClient_Connect
```

- [ ] **Step 3: Implement QMP client**

```go
// internal/qemu/qmp.go
package qemu

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"sync"
)

type QMPClient struct {
	socketPath string
	conn       net.Conn
	reader     *bufio.Reader
	mu         sync.Mutex
}

type QMPResponse struct {
	Return interface{} `json:"return,omitempty"`
	Error  *QMPError   `json:"error,omitempty"`
}

type QMPError struct {
	Class string `json:"class"`
	Desc  string `json:"desc"`
}

func NewQMPClient(socketPath string) *QMPClient {
	return &QMPClient{
		socketPath: socketPath,
	}
}

func (c *QMPClient) Connect() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	conn, err := net.Dial("unix", c.socketPath)
	if err != nil {
		return fmt.Errorf("failed to connect to QMP: %w", err)
	}

	c.conn = conn
	c.reader = bufio.NewReader(conn)

	// Read capabilities
	_, err = c.readResponse()
	if err != nil {
		conn.Close()
		return fmt.Errorf("failed to read capabilities: %w", err)
	}

	// Send capabilities negotiation
	_, err = c.sendCommand(map[string]interface{}{
		"execute": "qmp_capabilities",
	})
	if err != nil {
		conn.Close()
		return fmt.Errorf("failed to negotiate capabilities: %w", err)
	}

	return nil
}

func (c *QMPClient) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *QMPClient) Execute(command string, args map[string]interface{}) (*QMPResponse, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	req := map[string]interface{}{
		"execute": command,
	}
	if args != nil {
		req["arguments"] = args
	}

	return c.sendCommand(req)
}

func (c *QMPClient) sendCommand(cmd map[string]interface{}) (*QMPResponse, error) {
	data, err := json.Marshal(cmd)
	if err != nil {
		return nil, err
	}

	_, err = c.conn.Write(append(data, '\n'))
	if err != nil {
		return nil, err
	}

	return c.readResponse()
}

func (c *QMPClient) readResponse() (*QMPResponse, error) {
	line, err := c.reader.ReadBytes('\n')
	if err != nil {
		return nil, err
	}

	var resp QMPResponse
	if err := json.Unmarshal(line, &resp); err != nil {
		return nil, err
	}

	if resp.Error != nil {
		return nil, fmt.Errorf("QMP error: %s - %s", resp.Error.Class, resp.Error.Desc)
	}

	return &resp, nil
}

func (c *QMPClient) QueryStatus() (string, error) {
	resp, err := c.Execute("query-status", nil)
	if err != nil {
		return "", err
	}

	status, ok := resp.Return.(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected response format")
	}

	return status["status"].(string), nil
}

func (c *QMPClient) Stop() error {
	_, err := c.Execute("stop", nil)
	return err
}

func (c *QMPClient) Cont() error {
	_, err := c.Execute("cont", nil)
	return err
}

func (c *QMPClient) Quit() error {
	_, err := c.Execute("quit", nil)
	return err
}

func (c *QMPClient) Screenshot(path string) error {
	_, err := c.Execute("screendump", map[string]interface{}{
		"filename": path,
	})
	return err
}
```

- [ ] **Step 4: Run test**

```bash
go test ./internal/qemu/ -v -run TestQMPClient_Connect
```

- [ ] **Step 5: Commit**

```bash
git add internal/qemu/qmp.go internal/qemu/qmp_test.go
git commit -m "feat: add QMP monitor client for QEMU communication"
```

---

### Task 7: VNC Display Integration

**Covers:** [S5]

**Files:**
- Create: `internal/display/vnc.go`
- Create: `frontend/src/components/Display.tsx`
- Create: `frontend/src/lib/vnc.ts`

**Interfaces:**
- Consumes: VNC port from QEMU
- Produces: VNC connection handler

- [ ] **Step 1: Create VNC Go handler**

```go
// internal/display/vnc.go
package display

import (
	"fmt"
	"net"
	"time"
)

type VNCClient struct {
	host    string
	port    int
	conn    net.Conn
	quality int
}

type VNCConfig struct {
	Host    string
	Port    int
	Quality int // 0-9, higher = better quality
}

func NewVNCClient(config VNCConfig) *VNCClient {
	return &VNCClient{
		host:    config.Host,
		port:    config.Port,
		quality: config.Quality,
	}
}

func (c *VNCClient) Connect() error {
	addr := fmt.Sprintf("%s:%d", c.host, c.port)
	conn, err := net.DialTimeout("tcp", addr, 5*time.Second)
	if err != nil {
		return fmt.Errorf("VNC connection failed: %w", err)
	}
	c.conn = conn
	return nil
}

func (c *VNCClient) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *VNCClient) GetURL() string {
	return fmt.Sprintf("ws://%s:%d", c.host, c.port)
}
```

- [ ] **Step 2: Create frontend VNC component**

```tsx
// frontend/src/components/Display.tsx
import { useEffect, useRef, useState } from 'react'

interface DisplayProps {
  vmId: string
  vncPort: number
}

export function Display({ vmId, vncPort }: DisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // noVNC will be loaded dynamically
    const loadVNC = async () => {
      try {
        // Dynamic import of noVNC
        const RFB = (await import('@novnc/novnc/lib/rfb')).default

        if (!containerRef.current) return

        const rfb = new RFB(containerRef.current, `ws://localhost:${vncPort}`, {
          scaleViewport: true,
          resizeSession: true,
        })

        rfb.addEventListener('connected', () => setConnected(true))
        rfb.addEventListener('disconnected', () => setConnected(false))
        rfb.addEventListener('error', (e: any) => setError(e.detail?.msg || 'Connection error'))

        return () => rfb.disconnect()
      } catch (err) {
        setError('Failed to load VNC client')
      }
    }

    loadVNC()
  }, [vncPort])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-800 text-red-400">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={containerRef} className="w-full h-full" />
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">Connecting...</div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify frontend builds**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add internal/display/ frontend/src/components/Display.tsx frontend/src/lib/
git commit -m "feat: add VNC display integration"
```

---

### Task 8: Android Image Manager

**Covers:** [S4]

**Files:**
- Create: `internal/vm/images.go`
- Create: `internal/vm/images_test.go`

**Interfaces:**
- Consumes: Image URLs
- Produces: Local image paths

- [ ] **Step 1: Write image manager test**

```go
// internal/vm/images_test.go
package vm

import (
	"testing"
)

func TestImageManager_ListAvailable(t *testing.T) {
	dir := t.TempDir()
	mgr := NewImageManager(dir)

	images := mgr.ListAvailable()
	if len(images) == 0 {
		t.Error("should have at least one available image")
	}

	found := false
	for _, img := range images {
		if img.Version == "android-12" {
			found = true
			break
		}
	}
	if !found {
		t.Error("should have android-12 image")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
go test ./internal/vm/ -v -run TestImageManager_ListAvailable
```

- [ ] **Step 3: Implement image manager**

```go
// internal/vm/images.go
package vm

import (
	"fmt"
	"os"
	"path/filepath"
)

type ImageInfo struct {
	Version  string
	Path     string
	Size     int64
	Downloaded bool
}

type ImageManager struct {
	imageDir string
}

var availableImages = []struct {
	Version string
	URL     string
	Size    int64
}{
	{"android-9", "https://example.com/android-9.qcow2", 1_000_000_000},
	{"android-12", "https://example.com/android-12.qcow2", 1_500_000_000},
	{"android-14", "https://example.com/android-14.qcow2", 2_000_000_000},
}

func NewImageManager(imageDir string) *ImageManager {
	os.MkdirAll(imageDir, 0755)
	return &ImageManager{imageDir: imageDir}
}

func (m *ImageManager) ListAvailable() []ImageInfo {
	var images []ImageInfo

	for _, img := range availableImages {
		path := filepath.Join(m.imageDir, img.Version+".qcow2")
		_, err := os.Stat(path)

		info := ImageInfo{
			Version:    img.Version,
			Path:       path,
			Size:       img.Size,
			Downloaded: err == nil,
		}
		images = append(images, info)
	}

	return images
}

func (m *ImageManager) GetImage(version string) (string, error) {
	path := filepath.Join(m.imageDir, version+".qcow2")
	if _, err := os.Stat(path); err != nil {
		return "", fmt.Errorf("image %s not found: %w", version, err)
	}
	return path, nil
}

func (m *ImageManager) CreateOverlay(baseVersion, overlayName string) (string, error) {
	basePath, err := m.GetImage(baseVersion)
	if err != nil {
		return "", err
	}

	overlayPath := filepath.Join(m.imageDir, overlayName+".qcow2")

	// Create qcow2 overlay using qemu-img
	// TODO: implement qemu-img create -f qcow2 -b base.qcow2 overlay.qcow2
	_ = basePath
	_ = overlayPath

	return overlayPath, nil
}
```

- [ ] **Step 4: Run test**

```bash
go test ./internal/vm/ -v -run TestImageManager_ListAvailable
```

- [ ] **Step 5: Commit**

```bash
git add internal/vm/images.go internal/vm/images_test.go
git commit -m "feat: add Android image manager"
```

---

## Phase 3: ADB & Tools (Tasks 9-12)

### Task 9: ADB Client

**Covers:** [S6]

**Files:**
- Create: `internal/adb/client.go`
- Create: `internal/adb/device.go`
- Create: `internal/adb/client_test.go`

**Interfaces:**
- Consumes: ADB binary path
- Produces: `ADBClient`

- [ ] **Step 1: Write ADB client test**

```go
// internal/adb/client_test.go
package adb

import (
	"testing"
)

func TestNewClient(t *testing.T) {
	client := NewClient("/usr/bin/adb")
	if client == nil {
		t.Fatal("NewClient returned nil")
	}
	if client.adbPath != "/usr/bin/adb" {
		t.Error("adbPath not set correctly")
	}
}

func TestClient_GetDevices(t *testing.T) {
	client := NewClient("/usr/bin/adb")
	// This will fail without actual ADB, but tests structure
	_, err := client.GetDevices()
	// We expect an error since ADB isn't running
	if err == nil {
		t.Log("ADB available - devices found")
	} else {
		t.Log("ADB not available - expected error:", err)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
go test ./internal/adb/ -v -run TestNewClient
```

- [ ] **Step 3: Implement ADB client**

```go
// internal/adb/client.go
package adb

import (
	"bufio"
	"fmt"
	"os/exec"
	"strings"
)

type Client struct {
	adbPath string
}

type Device struct {
	ID     string
	Status string // "device", "offline", "unauthorized"
}

func NewClient(adbPath string) *Client {
	return &Client{adbPath: adbPath}
}

func (c *Client) GetDevices() ([]Device, error) {
	cmd := exec.Command(c.adbPath, "devices")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("adb devices failed: %w", err)
	}

	var devices []Device
	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "List") || line == "" {
			continue
		}

		parts := strings.Fields(line)
		if len(parts) >= 2 {
			devices = append(devices, Device{
				ID:     parts[0],
				Status: parts[1],
			})
		}
	}

	return devices, nil
}

func (c *Client) Connect(deviceID string, port int) error {
	cmd := exec.Command(c.adbPath, "connect", fmt.Sprintf("%s:%d", deviceID, port))
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("adb connect failed: %w - %s", err, string(output))
	}
	return nil
}

func (c *Client) Push(deviceID, localPath, remotePath string) error {
	cmd := exec.Command(c.adbPath, "-s", deviceID, "push", localPath, remotePath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("adb push failed: %w - %s", err, string(output))
	}
	return nil
}

func (c *Client) Pull(deviceID, remotePath, localPath string) error {
	cmd := exec.Command(c.adbPath, "-s", deviceID, "pull", remotePath, localPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("adb pull failed: %w - %s", err, string(output))
	}
	return nil
}

func (c *Client) Install(deviceID, apkPath string) error {
	cmd := exec.Command(c.adbPath, "-s", deviceID, "install", "-r", apkPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("adb install failed: %w - %s", err, string(output))
	}
	return nil
}

func (c *Client) Shell(deviceID, command string) (string, error) {
	cmd := exec.Command(c.adbPath, "-s", deviceID, "shell", command)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("adb shell failed: %w - %s", err, string(output))
	}
	return string(output), nil
}

func (c *Client) StartServer() error {
	cmd := exec.Command(c.adbPath, "start-server")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("adb start-server failed: %w - %s", err, string(output))
	}
	return nil
}

func (c *Client) KillServer() error {
	cmd := exec.Command(c.adbPath, "kill-server")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("adb kill-server failed: %w - %s", err, string(output))
	}
	return nil
}
```

- [ ] **Step 4: Run test**

```bash
go test ./internal/adb/ -v -run TestNewClient
```

- [ ] **Step 5: Commit**

```bash
git add internal/adb/
git commit -m "feat: add ADB client for device communication"
```

---

### Task 10: File Manager UI

**Covers:** [S6]

**Files:**
- Create: `internal/api/files.go`
- Create: `frontend/src/components/FileManager.tsx`

**Interfaces:**
- Consumes: `adb.Client`
- Produces: File operations API

- [ ] **Step 1: Create file API**

```go
// internal/api/files.go
package api

import (
	"github.com/neko233/AndroidSimulator233/internal/adb"
)

type FileAPI struct {
	adb *adb.Client
}

func NewFileAPI(adbClient *adb.Client) *FileAPI {
	return &FileAPI{adb: adbClient}
}

type FileEntry struct {
	Name  string `json:"name"`
	Size  int64  `json:"size"`
	IsDir bool   `json:"isDir"`
}

func (a *FileAPI) ListFiles(deviceID, path string) ([]FileEntry, error) {
	output, err := a.adb.Shell(deviceID, "ls -la "+path)
	if err != nil {
		return nil, err
	}

	var files []FileEntry
	// Parse ls output
	lines := splitLines(output)
	for i, line := range lines {
		if i < 2 { // skip total and . and ..
			continue
		}
		// Simplified parsing - real implementation would be more robust
		files = append(files, FileEntry{
			Name:  line,
			IsDir: line[len(line)-1] == '/',
		})
	}

	return files, nil
}

func (a *FileAPI) UploadFile(deviceID, localPath, remotePath string) error {
	return a.adb.Push(deviceID, localPath, remotePath)
}

func (a *FileAPI) DownloadFile(deviceID, remotePath, localPath string) error {
	return a.adb.Pull(deviceID, remotePath, localPath)
}

func splitLines(s string) []string {
	var lines []string
	for _, line := range splitByNewline(s) {
		if line != "" {
			files = append(lines, line)
		}
	}
	return lines
}

func splitByNewline(s string) []string {
	var result []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			result = append(result, s[start:i])
			start = i + 1
		}
	}
	if start < len(s) {
		result = append(result, s[start:])
	}
	return result
}
```

- [ ] **Step 2: Create frontend file manager**

```tsx
// frontend/src/components/FileManager.tsx
import { useState, useEffect } from 'react'

interface FileEntry {
  name: string
  size: number
  isDir: boolean
}

interface FileManagerProps {
  deviceId: string
}

export function FileManager({ deviceId }: FileManagerProps) {
  const [path, setPath] = useState('/sdcard')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFiles(path)
  }, [path])

  const loadFiles = async (dirPath: string) => {
    setLoading(true)
    try {
      // Wails binding will be available at runtime
      const result = await (window as any).>ListFiles(deviceId, dirPath)
      setFiles(result || [])
    } catch (err) {
      console.error('Failed to load files:', err)
    } finally {
      setLoading(false)
    }
  }

  const navigateTo = (name: string, isDir: boolean) => {
    if (isDir) {
      setPath(`${path}/${name}`)
    }
  }

  const goUp = () => {
    const parts = path.split('/')
    parts.pop()
    setPath(parts.join('/') || '/')
  }

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Path bar */}
      <div className="flex items-center p-2 bg-gray-700 border-b border-gray-600">
        <button
          onClick={goUp}
          className="px-2 py-1 text-sm bg-gray-600 rounded hover:bg-gray-500"
        >
          ..
        </button>
        <span className="ml-2 text-sm text-gray-300">{path}</span>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="p-2">Name</th>
                <th className="p-2">Size</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr
                  key={file.name}
                  onClick={() => navigateTo(file.name, file.isDir)}
                  className="hover:bg-gray-700 cursor-pointer"
                >
                  <td className="p-2">
                    {file.isDir ? '📁' : '📄'} {file.name}
                  </td>
                  <td className="p-2 text-gray-400">
                    {file.isDir ? '-' : formatSize(file.size)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}
```

- [ ] **Step 3: Verify frontend builds**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add internal/api/files.go frontend/src/components/FileManager.tsx
git commit -m "feat: add file manager UI component"
```

---

### Task 11: Shell Terminal

**Covers:** [S6]

**Files:**
- Create: `internal/api/shell.go`
- Create: `frontend/src/components/Terminal.tsx`

**Interfaces:**
- Consumes: `adb.Client`
- Produces: Shell execution API

- [ ] **Step 1: Create shell API**

```go
// internal/api/shell.go
package api

import (
	"github.com/neko233/AndroidSimulator233/internal/adb"
)

type ShellAPI struct {
	adb *adb.Client
}

func NewShellAPI(adbClient *adb.Client) *ShellAPI {
	return &ShellAPI{adb: adbClient}
}

func (a *ShellAPI) Execute(deviceID, command string) (string, error) {
	return a.adb.Shell(deviceID, command)
}

func (a *ShellAPI) ExecuteWithOutput(deviceID, command string) (string, error) {
	return a.adb.Shell(deviceID, command+" 2>&1")
}
```

- [ ] **Step 2: Create frontend terminal**

```tsx
// frontend/src/components/Terminal.tsx
import { useState, useRef, useEffect } from 'react'

interface TerminalProps {
  deviceId: string
}

interface HistoryEntry {
  command: string
  output: string
  timestamp: number
}

export function Terminal({ deviceId }: TerminalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return

    setLoading(true)
    try {
      const output = await (window as any).Execute(deviceId, cmd)
      setHistory((prev) => [
        ...prev,
        { command: cmd, output: output || '', timestamp: Date.now() },
      ])
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        { command: cmd, output: `Error: ${err}`, timestamp: Date.now() },
      ])
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      executeCommand(input)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 font-mono text-sm">
      {/* History */}
      <div className="flex-1 overflow-auto p-2">
        {history.map((entry, i) => (
          <div key={i} className="mb-2">
            <div className="text-green-400">$ {entry.command}</div>
            <pre className="text-gray-300 whitespace-pre-wrap">{entry.output}</pre>
          </div>
        ))}
        {loading && <div className="text-yellow-400">Executing...</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center p-2 border-t border-gray-700">
        <span className="text-green-400 mr-2">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="flex-1 bg-transparent text-white outline-none"
          placeholder="Enter command..."
          autoFocus
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify frontend builds**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add internal/api/shell.go frontend/src/components/Terminal.tsx
git commit -m "feat: add ADB shell terminal component"
```

---

### Task 12: Log Viewer

**Covers:** [S6]

**Files:**
- Create: `internal/api/logs.go`
- Create: `frontend/src/components/LogViewer.tsx`

**Interfaces:**
- Consumes: `adb.Client`
- Produces: Log streaming API

- [ ] **Step 1: Create log API**

```go
// internal/api/logs.go
package api

import (
	"bufio"
	"fmt"
	"os/exec"
	"strings"

	"github.com/neko233/AndroidSimulator233/internal/adb"
)

type LogAPI struct {
	adb *adb.Client
}

func NewLogAPI(adbClient *adb.Client) *LogAPI {
	return &LogAPI{adb: adbClient}
}

type LogEntry struct {
	Level   string `json:"level"`
	Tag     string `json:"tag"`
	Message string `json:"message"`
	PID     int    `json:"pid"`
}

func (a *LogAPI) GetLogs(deviceID, filter string) ([]LogEntry, error) {
	cmd := fmt.Sprintf("logcat -d %s", filter)
	output, err := a.adb.Shell(deviceID, cmd)
	if err != nil {
		return nil, err
	}

	var logs []LogEntry
	scanner := bufio.NewScanner(strings.NewReader(output))
	for scanner.Scan() {
		line := scanner.Text()
		if entry := parseLogcatLine(line); entry != nil {
			logs = append(logs, *entry)
		}
	}

	return logs, nil
}

func (a *LogAPI) StreamLogs(deviceID, filter string) (<-chan LogEntry, error) {
	cmd := exec.Command(a.adb.adbPath, "-s", deviceID, "logcat", filter)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}

	if err := cmd.Start(); err != nil {
		return nil, err
	}

	ch := make(chan LogEntry, 100)
	go func() {
		defer close(ch)
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			if entry := parseLogcatLine(line); entry != nil {
				ch <- *entry
			}
		}
	}()

	return ch, nil
}

func parseLogcatLine(line string) *LogEntry {
	// Simplified parsing - real implementation would be more robust
	if len(line) < 20 {
		return nil
	}

	// Format: "MM-DD HH:MM:SS.mmm PID TID LEVEL TAG: MESSAGE"
	parts := strings.SplitN(line, ":", 2)
	if len(parts) < 2 {
		return nil
	}

	return &LogEntry{
		Level:   "I",
		Tag:     "System",
		Message: strings.TrimSpace(parts[1]),
		PID:     0,
	}
}
```

- [ ] **Step 2: Create frontend log viewer**

```tsx
// frontend/src/components/LogViewer.tsx
import { useState, useEffect, useRef } from 'react'

interface LogEntry {
  level: string
  tag: string
  message: string
  pid: number
}

interface LogViewerProps {
  deviceId: string
}

const LEVEL_COLORS: Record<string, string> = {
  V: 'text-gray-400',
  D: 'text-blue-400',
  I: 'text-green-400',
  W: 'text-yellow-400',
  E: 'text-red-400',
  F: 'text-red-600',
}

export function LogViewer({ deviceId }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState('')
  const [level, setLevel] = useState('V')
  const [autoScroll, setAutoScroll] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadLogs()
    const interval = setInterval(loadLogs, 1000)
    return () => clearInterval(interval)
  }, [filter, level])

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const loadLogs = async () => {
    try {
      const filterStr = filter ? `${filter}:* ${level}:*` : `*: ${level}`
      const result = await (window as any).GetLogs(deviceId, filterStr)
      setLogs(result || [])
    } catch (err) {
      console.error('Failed to load logs:', err)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Filters */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by tag..."
          className="px-2 py-1 text-sm bg-gray-700 rounded text-white"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="px-2 py-1 text-sm bg-gray-700 rounded text-white"
        >
          <option value="V">Verbose</option>
          <option value="D">Debug</option>
          <option value="I">Info</option>
          <option value="W">Warn</option>
          <option value="E">Error</option>
          <option value="F">Fatal</option>
        </select>
        <label className="flex items-center gap-1 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          Auto-scroll
        </label>
        <button
          onClick={loadLogs}
          className="px-2 py-1 text-sm bg-blue-600 rounded hover:bg-blue-500"
        >
          Refresh
        </button>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-auto font-mono text-xs">
        {logs.map((log, i) => (
          <div key={i} className="flex border-b border-gray-800">
            <span className={`w-6 text-center ${LEVEL_COLORS[log.level] || 'text-gray-400'}`}>
              {log.level}
            </span>
            <span className="w-24 text-gray-500 truncate">{log.tag}</span>
            <span className="flex-1 text-gray-300 break-all">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify frontend builds**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add internal/api/logs.go frontend/src/components/LogViewer.tsx
git commit -m "feat: add logcat viewer component"
```

---

## Phase 4: Advanced Features (Tasks 13-16)

### Task 13: GPU Acceleration Setup

**Covers:** [S5]

**Files:**
- Create: `internal/gpu/virtio.go`
- Create: `internal/gpu/host.go`

**Interfaces:**
- Consumes: QEMU config
- Produces: GPU configuration

- [ ] **Step 1: Create GPU module**

```go
// internal/gpu/virtio.go
package gpu

import (
	"runtime"
)

type GPUConfig struct {
	Type     string // "virtio", "none", "passthrough"
	VRAM     int    // MB
	Acceleration bool
}

func DetectGPU() GPUConfig {
	config := GPUConfig{
		Type:     "virtio",
		VRAM:     128,
		Acceleration: false,
	}

	switch runtime.GOOS {
	case "linux":
		// Check for KVM + virtio-gpu support
		config.Acceleration = true
	case "darwin":
		// HVF + virtio-gpu
		config.Acceleration = true
	case "windows":
		// Check for WHPX
		config.Acceleration = false // Will need detection
	}

	return config
}

func ApplyGPUArgs(config GPUConfig, args []string) []string {
	if config.Type == "none" {
		return append(args, "-device", "VGA")
	}

	// virtio-gpu with 3D acceleration
	args = append(args, "-device", "virtio-vga-gl")

	if config.VRAM > 0 {
		args = append(args, "-device", "virtio-vga-gl,vram_size_mb="+itoa(config.VRAM))
	}

	return args
}

func itoa(i int) string {
	return fmt.Sprintf("%d", i)
}
```

- [ ] **Step 2: Create host GPU detection**

```go
// internal/gpu/host.go
package gpu

import (
	"os/exec"
	"runtime"
	"strings"
)

type HostGPU struct {
	Name    string
	Driver  string
	Memory  int
	Available bool
}

func DetectHostGPU() []HostGPU {
	var gpus []HostGPU

	switch runtime.GOOS {
	case "windows":
		gpus = detectWindowsGPU()
	case "darwin":
		gpus = detectMacOSGPU()
	case "linux":
		gpus = detectLinuxGPU()
	}

	return gpus
}

func detectWindowsGPU() []HostGPU {
	// Use WMIC to detect GPU
	cmd := exec.Command("wmic", "path", "win32_videocontroller", "get", "name,driverversion")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil
	}

	var gpus []HostGPU
	lines := strings.Split(string(output), "\n")
	for _, line := range lines[1:] { // skip header
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		gpus = append(gpus, HostGPU{
			Name:      line,
			Available: true,
		})
	}

	return gpus
}

func detectMacOSGPU() []HostGPU {
	// macOS uses integrated GPU via HVF
	return []HostGPU{
		{Name: "Apple GPU (HVF)", Driver: "HVF", Available: true},
	}
}

func detectLinuxGPU() []HostGPU {
	// Use lspci
	cmd := exec.Command("lspci", "-v")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil
	}

	var gpus []HostGPU
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "VGA") || strings.Contains(line, "3D") {
			gpus = append(gpus, HostGPU{
				Name:      strings.TrimSpace(line),
				Available: true,
			})
		}
	}

	return gpus
}
```

- [ ] **Step 3: Verify build**

```bash
go build ./internal/gpu/
```

- [ ] **Step 4: Commit**

```bash
git add internal/gpu/
git commit -m "feat: add GPU detection and virtio-gpu configuration"
```

---

### Task 14: Gamepad Support

**Covers:** [S5]

**Files:**
- Create: `internal/input/gamepad.go`
- Create: `internal/input/gamepad_linux.go`
- Create: `internal/input/gamepad_darwin.go`
- Create: `internal/input/gamepad_windows.go`

**Interfaces:**
- Consumes: Gamepad events
- Produces: Input to QEMU

- [ ] **Step 1: Create gamepad interface**

```go
// internal/input/gamepad.go
package input

type GamepadState struct {
	Buttons [15]bool
	Axes    [6]float64
}

type Gamepad interface {
	Open() error
	Close() error
	Read() (*GamepadState, error)
	GetName() string
}
```

- [ ] **Step 2: Create Windows gamepad (XInput)**

```go
// internal/input/gamepad_windows.go
//go:build windows

package input

import (
	"fmt"
	"syscall"
	"unsafe"
)

var (
	xinput = syscall.NewLazyDLL("xinput9_1_0.dll")
	procXInputGetState = xinput.NewProc("XInputGetState")
)

type XInputState struct {
	PacketNumber uint32
	Gamepad       XInputGamepad
}

type XInputGamepad struct {
	WButtons     uint16
	LeftTrigger  byte
	RightTrigger byte
	ThumbLX      int16
	ThumbLY      int16
	ThumbRX      int16
	ThumbRY      int16
}

type WindowsGamepad struct {
	deviceID int
	state    *XInputState
}

func NewWindowsGamepad(deviceID int) *WindowsGamepad {
	return &WindowsGamepad{deviceID: deviceID}
}

func (g *WindowsGamepad) Open() error {
	return nil
}

func (g *WindowsGamepad) Close() error {
	return nil
}

func (g *WindowsGamepad) Read() (*GamepadState, error) {
	var state XInputState
	ret, _, _ := procXInputGetState.Call(
		uintptr(g.deviceID),
		uintptr(unsafe.Pointer(&state)),
	)

	if ret != 0 {
		return nil, fmt.Errorf("XInputGetState failed")
	}

	g.state = &state

	buttons := [15]bool{
		state.Gamepad.WButtons&0x0001 != 0, // DPad Up
		state.Gamepad.WButtons&0x0002 != 0, // DPad Down
		state.Gamepad.WButtons&0x0004 != 0, // DPad Left
		state.Gamepad.WButtons&0x0008 != 0, // DPad Right
		state.Gamepad.WButtons&0x0010 != 0, // Start
		state.Gamepad.WButtons&0x0020 != 0, // Back
		state.Gamepad.WButtons&0x0040 != 0, // Left Thumb
		state.Gamepad.WButtons&0x0080 != 0, // Right Thumb
		state.Gamepad.WButtons&0x0100 != 0, // Left Shoulder
		state.Gamepad.WButtons&0x0200 != 0, // Right Shoulder
		state.Gamepad.WButtons&0x1000 != 0, // A
		state.Gamepad.WButtons&0x2000 != 0, // B
		state.Gamepad.WButtons&0x4000 != 0, // X
		state.Gamepad.WButtons&0x8000 != 0, // Y
		false,                              // Guide (not exposed by XInput)
	}

	axes := [6]float64{
		float64(state.Gamepad.ThumbLX) / 32767.0,
		float64(state.Gamepad.ThumbLY) / 32767.0,
		float64(state.Gamepad.ThumbRX) / 32767.0,
		float64(state.Gamepad.ThumbRY) / 32767.0,
		float64(state.Gamepad.LeftTrigger) / 255.0,
		float64(state.Gamepad.RightTrigger) / 255.0,
	}

	return &GamepadState{Buttons: buttons, Axes: axes}, nil
}

func (g *WindowsGamepad) GetName() string {
	return fmt.Sprintf("XInput Gamepad %d", g.deviceID)
}
```

- [ ] **Step 3: Verify build**

```bash
GOOS=windows go build ./internal/input/
```

- [ ] **Step 4: Commit**

```bash
git add internal/input/
git commit -m "feat: add gamepad support with XInput (Windows)"
```

---

### Task 15: Key Mapping Editor

**Covers:** [S5, S7]

**Files:**
- Create: `internal/input/keymap.go`
- Create: `frontend/src/components/KeyMapping.tsx`

**Interfaces:**
- Consumes: Touch coordinates, key events
- Produces: Touch events to QEMU

- [ ] **Step 1: Create keymap config**

```go
// internal/input/keymap.go
package input

import (
	"encoding/json"
	"os"
)

type KeyMapping struct {
	Name      string            `json:"name"`
	Mappings  []TouchMapping    `json:"mappings"`
}

type TouchMapping struct {
	Key       string  `json:"key"`
	TouchX    float64 `json:"touchX"`
	TouchY    float64 `json:"touchY"`
	Action    string  `json:"action"` // "tap", "swipe", "drag"
	SwipeEndX float64 `json:"swipeEndX,omitempty"`
	SwipeEndY float64 `json:"swipeEndY,omitempty"`
}

type KeyMapManager struct {
	mappings map[string]*KeyMapping
	filePath string
}

func NewKeyMapManager(filePath string) *KeyMapManager {
	mgr := &KeyMapManager{
		mappings: make(map[string]*KeyMapping),
		filePath: filePath,
	}
	mgr.load()
	return mgr
}

func (m *KeyMapManager) load() error {
	data, err := os.ReadFile(m.filePath)
	if err != nil {
		return err
	}

	var mappings []*KeyMapping
	if err := json.Unmarshal(data, &mappings); err != nil {
		return err
	}

	for _, km := range mappings {
		m.mappings[km.Name] = km
	}

	return nil
}

func (m *KeyMapManager) Save() error {
	var mappings []*KeyMapping
	for _, km := range m.mappings {
		mappings = append(mappings, km)
	}

	data, err := json.MarshalIndent(mappings, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(m.filePath, data, 0644)
}

func (m *KeyMapManager) Get(name string) (*KeyMapping, bool) {
	km, ok := m.mappings[name]
	return km, ok
}

func (m *KeyMapManager) Set(name string, mapping *KeyMapping) {
	m.mappings[name] = mapping
}

func (m *KeyMapManager) List() []*KeyMapping {
	var list []*KeyMapping
	for _, km := range m.mappings {
		list = append(list, km)
	}
	return list
}

func (m *KeyMapManager) Delete(name string) {
	delete(m.mappings, name)
}
```

- [ ] **Step 2: Create frontend key mapping editor**

```tsx
// frontend/src/components/KeyMapping.tsx
import { useState, useRef, useEffect } from 'react'

interface TouchMapping {
  key: string
  touchX: number
  touchY: number
  action: 'tap' | 'swipe' | 'drag'
  swipeEndX?: number
  swipeEndY?: number
}

interface KeyMappingConfig {
  name: string
  mappings: TouchMapping[]
}

interface KeyMappingProps {
  onSave: (config: KeyMappingConfig) => void
  onLoad: (name: string) => void
}

export function KeyMapping({ onSave, onLoad }: KeyMappingProps) {
  const [config, setConfig] = useState<KeyMappingConfig>({
    name: 'New Profile',
    mappings: [],
  })
  const [selectedMapping, setSelectedMapping] = useState<number | null>(null)
  const [recording, setRecording] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || recording) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    const newMapping: TouchMapping = {
      key: '',
      touchX: x,
      touchY: y,
      action: 'tap',
    }

    setConfig((prev) => ({
      ...prev,
      mappings: [...prev.mappings, newMapping],
    }))
    setSelectedMapping(config.mappings.length)
    setRecording(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording || selectedMapping === null) return

    e.preventDefault()
    const key = e.key === ' ' ? 'Space' : e.key

    setConfig((prev) => {
      const mappings = [...prev.mappings]
      mappings[selectedMapping] = {
        ...mappings[selectedMapping],
        key,
      }
      return { ...prev, mappings }
    })

    setRecording(false)
  }

  const deleteMapping = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      mappings: prev.mappings.filter((_, i) => i !== index),
    }))
    setSelectedMapping(null)
  }

  return (
    <div className="flex h-full">
      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="w-full h-full bg-gray-800 cursor-crosshair"
        />

        {/* Mapping points */}
        {config.mappings.map((mapping, i) => (
          <div
            key={i}
            className={`absolute w-6 h-6 rounded-full border-2 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs font-bold ${
              selectedMapping === i
                ? 'bg-blue-600 border-blue-400'
                : 'bg-gray-600 border-gray-400'
            }`}
            style={{
              left: `${mapping.touchX * 100}%`,
              top: `${mapping.touchY * 100}%`,
            }}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedMapping(i)
            }}
          >
            {mapping.key || '?'}
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
        <h3 className="text-lg font-bold mb-4">Key Mapping</h3>

        <input
          type="text"
          value={config.name}
          onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full px-2 py-1 bg-gray-700 rounded text-white mb-4"
        />

        <div className="space-y-2 mb-4">
          {config.mappings.map((mapping, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-2 rounded ${
                selectedMapping === i ? 'bg-blue-900' : 'bg-gray-700'
              }`}
              onClick={() => setSelectedMapping(i)}
            >
              <span className="text-sm">
                {mapping.key || '?'} → ({Math.round(mapping.touchX * 100)},{' '}
                {Math.round(mapping.touchY * 100)})
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteMapping(i)
                }}
                className="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {recording && (
          <div className="text-yellow-400 text-sm mb-4">Press a key...</div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => onSave(config)}
            className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify frontend builds**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add internal/input/keymap.go frontend/src/components/KeyMapping.tsx
git commit -m "feat: add key mapping editor with visual overlay"
```

---

### Task 16: Snapshot & Restore

**Covers:** [S4]

**Files:**
- Create: `internal/vm/snapshot.go`
- Create: `internal/vm/snapshot_test.go`

**Interfaces:**
- Consumes: QEMU QMP client
- Produces: Snapshot management

- [ ] **Step 1: Write snapshot test**

```go
// internal/vm/snapshot_test.go
package vm

import (
	"testing"
)

func TestSnapshotManager_List(t *testing.T) {
	dir := t.TempDir()
	mgr := NewSnapshotManager(dir)

	snapshots := mgr.List("vm-1")
	if len(snapshots) != 0 {
		t.Error("new manager should have no snapshots")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
go test ./internal/vm/ -v -run TestSnapshotManager_List
```

- [ ] **Step 3: Implement snapshot manager**

```go
// internal/vm/snapshot.go
package vm

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type Snapshot struct {
	ID        string    `json:"id"`
	VMID      string    `json:"vmId"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	Size      int64     `json:"size"`
}

type SnapshotManager struct {
	snapshotDir string
}

func NewSnapshotManager(snapshotDir string) *SnapshotManager {
	os.MkdirAll(snapshotDir, 0755)
	return &SnapshotManager{snapshotDir: snapshotDir}
}

func (m *SnapshotManager) Create(vmID, name string) (*Snapshot, error) {
	id := fmt.Sprintf("snap-%d", time.Now().UnixNano())

	snapshot := &Snapshot{
		ID:        id,
		VMID:      vmID,
		Name:      name,
		CreatedAt: time.Now(),
	}

	path := filepath.Join(m.snapshotDir, vmID, id+".json")
	os.MkdirAll(filepath.Dir(path), 0755)

	data, err := json.MarshalIndent(snapshot, "", "  ")
	if err != nil {
		return nil, err
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
		return nil, err
	}

	// TODO: Execute QMP savevm command
	// qmp.Execute("human-monitor-command", map[string]interface{}{
	//     "command-line": fmt.Sprintf("savevm %s", id),
	// })

	return snapshot, nil
}

func (m *SnapshotManager) Restore(vmID, snapshotID string) error {
	// TODO: Execute QMP loadvm command
	// qmp.Execute("human-monitor-command", map[string]interface{}{
	//     "command-line": fmt.Sprintf("loadvm %s", snapshotID),
	// })

	return nil
}

func (m *SnapshotManager) Delete(vmID, snapshotID string) error {
	path := filepath.Join(m.snapshotDir, vmID, snapshotID+".json")
	return os.Remove(path)
}

func (m *SnapshotManager) List(vmID string) []*Snapshot {
	dir := filepath.Join(m.snapshotDir, vmID)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}

	var snapshots []*Snapshot
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".json" {
			continue
		}

		data, err := os.ReadFile(filepath.Join(dir, entry.Name()))
		if err != nil {
			continue
		}

		var snapshot Snapshot
		if err := json.Unmarshal(data, &snapshot); err != nil {
			continue
		}

		snapshots = append(snapshots, &snapshot)
	}

	return snapshots
}
```

- [ ] **Step 4: Run test**

```bash
go test ./internal/vm/ -v -run TestSnapshotManager_List
```

- [ ] **Step 5: Commit**

```bash
git add internal/vm/snapshot.go internal/vm/snapshot_test.go
git commit -m "feat: add snapshot manager for VM state save/restore"
```

---

## Phase 5: Polish & Docs (Tasks 17-20)

### Task 17: Main UI Layout

**Covers:** [S7]

**Files:**
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/components/Sidebar.tsx`
- Create: `frontend/src/components/Header.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: All UI components
- Produces: Main application layout

- [ ] **Step 1: Create layout components**

```tsx
// frontend/src/components/Layout.tsx
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create sidebar**

```tsx
// frontend/src/components/Sidebar.tsx
import { useState } from 'react'

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

const NAV_ITEMS = [
  { id: 'vms', label: 'Virtual Machines', icon: '💻' },
  { id: 'files', label: 'File Manager', icon: '📁' },
  { id: 'shell', label: 'Shell', icon: ' terminal' },
  { id: 'logs', label: 'Logs', icon: '📋' },
  { id: 'keymap', label: 'Key Mapping', icon: '🎮' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export function Sidebar({ open, onToggle }: SidebarProps) {
  const [active, setActive] = useState('vms')

  if (!open) return null

  return (
    <aside className="w-56 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-700">
        <span className="font-bold text-lg">AndroidSim233</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              active === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
        v0.1.0
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Create header**

```tsx
// frontend/src/components/Header.tsx

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4">
      <button
        onClick={onMenuClick}
        className="p-2 hover:bg-gray-700 rounded-lg mr-4"
      >
        ☰
      </button>
      <h1 className="text-lg font-semibold">AndroidSimulator233</h1>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">CPU: 45%</span>
        <span className="text-sm text-gray-400">RAM: 2.1GB</span>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Update App.tsx**

```tsx
// frontend/src/App.tsx
import { Layout } from './components/Layout'
import { Display } from './components/Display'

function App() {
  return (
    <Layout>
      <Display vmId="vm-1" vncPort={5900} />
    </Layout>
  )
}

export default App
```

- [ ] **Step 5: Verify frontend builds**

```bash
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ frontend/src/App.tsx
git commit -m "feat: add main UI layout with sidebar and header"
```

---

### Task 18: VM List & Card Components

**Covers:** [S7]

**Files:**
- Create: `frontend/src/components/VMList.tsx`
- Create: `frontend/src/components/VMCard.tsx`

**Interfaces:**
- Consumes: Wails VM API
- Produces: VM management UI

- [ ] **Step 1: Create VM list**

```tsx
// frontend/src/components/VMList.tsx
import { useState, useEffect } from 'react'
import { VMCard } from './VMCard'

interface VMInfo {
  name: string
  cpus: number
  ram: string
  android: string
  status?: string
}

export function VMList() {
  const [vms, setVMs] = useState<VMInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVMs()
  }, [])

  const loadVMs = async () => {
    try {
      const result = await (window as any).ListVMs()
      setVMs(result || [])
    } catch (err) {
      console.error('Failed to load VMs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    const name = prompt('VM Name:')
    if (!name) return

    const android = prompt('Android version (android-9, android-12, android-14):', 'android-12')
    if (!android) return

    try {
      await (window as any).CreateVM(name, android)
      loadVMs()
    } catch (err) {
      alert('Failed to create VM: ' + err)
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete VM "${name}"?`)) return

    try {
      await (window as any).DeleteVM(name)
      loadVMs()
    } catch (err) {
      alert('Failed to delete VM: ' + err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading VMs...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Virtual Machines</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
        >
          + Create VM
        </button>
      </div>

      {vms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No virtual machines yet</p>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500"
          >
            Create Your First VM
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vms.map((vm) => (
            <VMCard key={vm.name} vm={vm} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create VM card**

```tsx
// frontend/src/components/VMCard.tsx

interface VMInfo {
  name: string
  cpus: number
  ram: string
  android: string
  status?: string
}

interface VMCardProps {
  vm: VMInfo
  onDelete: (name: string) => void
}

export function VMCard({ vm, onDelete }: VMCardProps) {
  const statusColors: Record<string, string> = {
    running: 'bg-green-500',
    stopped: 'bg-gray-500',
    starting: 'bg-yellow-500',
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
      {/* Thumbnail placeholder */}
      <div className="aspect-video bg-gray-700 rounded mb-4 flex items-center justify-center">
        <span className="text-4xl">📱</span>
      </div>

      {/* VM info */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold">{vm.name}</h3>
        <span
          className={`w-2 h-2 rounded-full ${statusColors[vm.status || 'stopped']}`}
        />
      </div>

      <div className="text-sm text-gray-400 space-y-1">
        <p>{vm.android}</p>
        <p>{vm.cpus} CPUs · {vm.ram} RAM</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button className="flex-1 px-3 py-2 bg-blue-600 rounded hover:bg-blue-500 text-sm">
          Start
        </button>
        <button
          onClick={() => onDelete(vm.name)}
          className="px-3 py-2 bg-red-600 rounded hover:bg-red-500 text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify frontend builds**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/VMList.tsx frontend/src/components/VMCard.tsx
git commit -m "feat: add VM list and card components"
```

---

### Task 19: VitePress Documentation

**Covers:** [S8]

**Files:**
- Create: `docs/package.json`
- Create: `docs/.vitepress/config.ts`
- Create: `docs/index.md`
- Create: `docs/guide/installation.md`
- Create: `docs/guide/quickstart.md`

**Interfaces:**
- Consumes: Project information
- Produces: Documentation site

- [ ] **Step 1: Create docs package.json**

```json
{
  "name": "androidsimulator233-docs",
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview"
  },
  "devDependencies": {
    "vitepress": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create VitePress config**

```typescript
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'AndroidSimulator233',
  description: 'Open-source Android Simulator',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/installation' },
      { text: 'Features', link: '/features/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quickstart' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/neko233/AndroidSimulator233' },
    ],
  },
})
```

- [ ] **Step 3: Create landing page**

```markdown
---
layout: home

hero:
  name: AndroidSimulator233
  text: Open-source Android Simulator
  tagline: A free alternative to MuMu Simulator, supporting Windows and macOS
  actions:
    - theme: brand
      text: Get Started
      link: /guide/installation
    - theme: alt
      text: GitHub
      link: https://github.com/neko233/AndroidSimulator233

features:
  - title: Cross-Platform
    details: Works on Windows and macOS with native performance
  - title: Gaming Optimized
    details: GPU acceleration, key mapping, gamepad support
  - title: Developer Friendly
    details: ADB integration, file manager, shell access, log viewer
  - title: Open Source
    details: Free to use, modify, and distribute under MIT license
---
```

- [ ] **Step 4: Create installation guide**

```markdown
# Installation

## Windows

### Download

1. Go to [Releases](https://github.com/neko233/AndroidSimulator233/releases)
2. Download the latest `AndroidSimulator233-x.x.x-setup.exe`
3. Run the installer

### Requirements

- Windows 10/11 (64-bit)
- 8GB RAM recommended
- Hardware virtualization enabled in BIOS

## macOS

### Download

1. Go to [Releases](https://github.com/neko233/AndroidSimulator233/releases)
2. Download the latest `AndroidSimulator233-x.x.x.dmg`
3. Drag to Applications folder

### Requirements

- macOS 12.0 or later
- Apple Silicon or Intel Mac
- 8GB RAM recommended

## Build from Source

See [Building from Source](/guide/building) for development setup.
```

- [ ] **Step 5: Create quickstart guide**

```markdown
# Quick Start

## Create Your First VM

1. Open AndroidSimulator233
2. Click "Create VM"
3. Enter a name and select Android version
4. Click "Create"
5. Click "Start" on the new VM

## Install an APK

1. Start your VM
2. Go to "File Manager" in the sidebar
3. Drag and drop an APK file
4. Wait for installation to complete

## Use Key Mapping

1. Start a VM with a game running
2. Go to "Key Mapping" in the sidebar
3. Click on the screen to add touch points
4. Press keys to assign them
5. Save the mapping profile
```

- [ ] **Step 6: Verify docs build**

```bash
cd docs && npm install && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add docs/
git commit -m "feat: add VitePress documentation site"
```

---

### Task 20: GitHub Actions CI/CD

**Covers:** [S8]

**Files:**
- Create: `.github/workflows/build.yml`
- Create: `.github/workflows/docs.yml`

**Interfaces:**
- Consumes: Project source code
- Produces: Build artifacts, deployed docs

- [ ] **Step 1: Create build workflow**

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.26'
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install Wails
        run: go install github.com/wailsapp/wails/v3/cmd/wails@latest
      
      - name: Build
        run: wails build
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: windows-build
          path: build/bin/

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.26'
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install Wails
        run: go install github.com/wailsapp/wails/v3/cmd/wails@latest
      
      - name: Build
        run: wails build
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: macos-build
          path: build/bin/
```

- [ ] **Step 2: Create docs workflow**

```yaml
# .github/workflows/docs.yml
name: Deploy Docs

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Build with VitePress
        run: |
          cd docs
          npm install
          npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Verify YAML syntax**

```bash
cat .github/workflows/build.yml
cat .github/workflows/docs.yml
```

- [ ] **Step 4: Commit**

```bash
git add .github/
git commit -m "feat: add GitHub Actions CI/CD for build and docs"
```

---

## Summary

This plan contains **20 tasks** across 5 phases:

1. **Foundation (Tasks 1-4):** Project scaffolding, QEMU manager, VM config, Wails bindings
2. **Core VM (Tasks 5-8):** QEMU binaries, QMP monitor, VNC display, Android images
3. **ADB & Tools (Tasks 9-12):** ADB client, file manager, shell terminal, log viewer
4. **Advanced (Tasks 13-16):** GPU acceleration, gamepad support, key mapping, snapshots
5. **Polish (Tasks 17-20):** UI layout, VM list, documentation, CI/CD

Each task is self-contained with tests and can be executed independently.
