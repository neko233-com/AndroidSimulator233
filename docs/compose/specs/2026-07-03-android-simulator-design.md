# AndroidSimulator233 Design Spec

## [S1] Problem

Build an open-source Android simulator to replace MuMu Simulator, supporting Windows and macOS. The simulator must handle all use cases: gaming, app development, general purpose, and automation.

## [S2] Solution Overview

A Wails v3 application (Go backend + Vite/React frontend) that manages QEMU-based Android virtual machines. QEMU binaries are bundled per-platform. Android system images (9-12-14) are pre-built AOSP images stored as qcow2 overlays.

**Tech Stack:**
- Backend: Go 1.26+ with Wails v3
- Frontend: Vite 8 + React 19 + TypeScript + Tailwind CSS
- VM: QEMU with KVM (Linux) / HVF (macOS) / WHPX (Windows)
- Display: VNC (built into QEMU) rendered via noVNC in frontend
- Docs: VitePress on GitHub Pages

## [S3] Core Architecture

```
AndroidSimulator233/
├── main.go                    # Wails entry point
├── app.go                     # App struct, Wails bindings
├── internal/
│   ├── qemu/                  # QEMU process manager
│   │   ├── manager.go         # Start/stop/restart QEMU instances
│   │   ├── config.go          # QEMU command-line builder
│   │   └── monitor.go         # QMP (QEMU Machine Protocol) client
│   ├── vm/                    # Virtual Machine lifecycle
│   │   ├── instance.go        # VM instance model
│   │   ├── manager.go         # Multi-instance management
│   │   ├── snapshot.go        # Snapshot/restore
│   │   └── config.go          # VM configuration (CPU, RAM, disk)
│   ├── adb/                   # ADB client
│   │   ├── client.go          # ADB command wrapper
│   │   └── device.go          # Device detection
│   ├── display/               # Display streaming
│   │   ├── vnc.go             # VNC client for display
│   │   └── spice.go           # SPICE client (alternative)
│   ├── gpu/                   # GPU acceleration
│   │   ├── virtio.go          # virtio-gpu setup
│   │   └── host.go            # Host GPU passthrough
│   ├── input/                 # Input handling
│   │   ├── keyboard.go        # Keyboard mapping
│   │   ├── mouse.go           # Mouse/trackpad
│   │   └── gamepad.go         # Gamepad support
│   ├── network/               # Network configuration
│   │   ├── nat.go             # NAT networking
│   │   └── bridge.go          # Bridge networking
│   └── config/                # App configuration
│       ├── settings.go        # Global settings
│       └── paths.go           # Path management
├── frontend/                  # Vite + React
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── VMList.tsx     # Instance manager
│   │   │   ├── VMCard.tsx     # Single VM card
│   │   │   ├── Settings.tsx   # Settings panel
│   │   │   ├── Display.tsx    # Android screen viewer
│   │   │   └── KeyMapping.tsx # Key mapping editor
│   │   └── lib/
│   │       └── wails.ts       # Wails bindings
│   └── vite.config.ts
├── qemu/                      # Bundled QEMU binaries
│   ├── win-x64/
│   └── macos-arm64/
├── images/                    # Android system images
│   ├── android-9/
│   ├── android-12/
│   └── android-14/
├── docs/                      # VitePress documentation
└── build/                     # Build scripts & resources
```

## [S4] QEMU Integration & VM Management

### QEMU Command Builder

```go
type QEMUConfig struct {
    CPUs      int    // 1-16
    RAM       string // "2G", "4G", "8G"
    Disk      string // path to qcow2 image
    Display   string // "vnc=:0" or "spice"
    GPU       string // "virtio" or "none"
    Network   string // "user" (NAT) or "bridge"
    ADBPort   int    // forwarded ADB port
    KVM       bool   // enable KVM/HVF acceleration
}

func (c *QEMUConfig) BuildArgs() []string
// Builds: qemu-system-x86_64 -m 4G -smp 4 -enable-kvm ...
```

### VM Lifecycle

1. **Create**: Download/select Android image → create qcow2 overlay → configure VM
2. **Start**: Build QEMU args → start process → wait for QMP connection → boot Android
3. **Stop**: Send QMP quit command → wait for process exit → cleanup
4. **Snapshot**: QEMU snapshot command → save state to disk
5. **Restore**: Load snapshot → resume VM

### QMP Monitor

- Unix socket per VM instance
- Commands: query-status, stop, cont, system_reset, screenshot
- Events: SHUTDOWN, RESET, STOP

### Multi-Instance

- Each VM gets unique QMP socket, VNC port, ADB port
- Port allocation: VNC 5900+N, ADB 5555+N, QMP /tmp/qmp-N
- Instance metadata stored in JSON config file

### Android System Images

- Pre-built AOSP images (android-9, android-12, android-14)
- Stored as qcow2 files with backing file (saves disk space)
- Download on first use or bundled with installer

## [S5] Display, Input & GPU

### Display Streaming

- VNC server built into QEMU (no extra deps)
- Frontend renders VNC via `react-vnc` or `@novnc/novnc`
- Support resolutions: 720p, 1080p, 1440p, custom
- Frame rate target: 30-60 FPS

### GPU Acceleration

- **virtio-gpu**: Default, good for most use cases
- **Host GPU passthrough**: NVIDIA/AMD via VFIO (advanced, needs IOMMU)
- **SwiftShader**: Software rendering fallback
- Configurable per-VM in settings

### Input Handling

- **Keyboard**: Direct passthrough via QEMU input subsystem
- **Mouse**: Relative/absolute mode toggle
- **Gamepad**: Xbox/PS controller via SDL2 input
- **Key Mapping**: Customizable key→touch mapping for games
  - Preset profiles for popular games
  - Visual editor to drag-and-drop touch points

### Multi-touch

- QEMU supports multi-touch via virtio-input
- Frontend captures touch events → sends to QEMU
- Important for mobile game controls

### Screenshot/Recording

- QMP screenshot command → save PNG
- Screen recording via VNC stream capture

## [S6] ADB Integration & File Management

### ADB Client

- Go wrapper around `adb` command
- Auto-detect ADB path (bundled or system)
- Support: connect, push, pull, install, shell, logcat

### Device Management

- Auto-connect to running VMs via forwarded ADB port
- Device list in UI with status (online/offline)
- Quick actions: restart ADB server, reconnect

### File Manager

- Browse device filesystem via ADB
- Upload/download files with progress
- Drag-and-drop APK installation
- Common paths shortcut (sdcard, downloads, etc.)

### APK Management

- Install APK from file picker
- Batch install multiple APKs
- Uninstall apps
- App list with size/version info

### Shell Access

- Built-in terminal emulator
- ADB shell with full command support
- Common commands shortcut buttons

### Log Viewer

- Real-time logcat streaming
- Filter by tag, level, PID
- Search and export logs

### Clipboard Sync

- Bidirectional clipboard between host and Android
- Auto-sync or manual paste

## [S7] Frontend UI Design

### Tech Stack

- Vite 8 + React 19 + TypeScript
- Tailwind CSS for styling
- Wails v3 bindings for Go<->JS communication

### Main Screens

1. **Home / VM List**
   - Grid of VM cards (thumbnail, name, status, actions)
   - Create new VM button
   - Quick stats (CPU/RAM usage)

2. **VM Detail / Display**
   - Full Android screen (VNC canvas)
   - Toolbar: home, back, recent, volume, power
   - Tab bar: Display, Files, Shell, Logs, KeyMap

3. **Settings**
   - Global: ADB path, QEMU path, default resolution
   - Per-VM: CPU, RAM, disk, GPU, network
   - Display: quality, frame rate, scaling
   - Input: sensitivity, deadzone

4. **Key Mapping Editor**
   - Visual overlay on Android screen
   - Drag to place touch points
   - Assign keyboard/mouse/gamepad keys
   - Save/load preset profiles

5. **Instance Manager**
   - Clone VM
   - Import/export VM
   - Delete VM
   - Disk cleanup

### UI Style

- Dark theme (like MuMu/BlueStacks)
- Flat design, subtle shadows
- Responsive layout
- System tray integration

## [S8] Documentation Site

### Structure

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress config
├── index.md               # Landing page
├── guide/
│   ├── installation.md    # Install guide (Win/Mac)
│   ├── quickstart.md      # First VM in 5 minutes
│   ├── configuration.md   # VM settings
│   └── troubleshooting.md # Common issues
├── features/
│   ├── gpu.md             # GPU acceleration
│   ├── keymapping.md      # Key mapping guide
│   ├── adb.md             # ADB & file management
│   └── multi-instance.md  # Running multiple VMs
├── development/
│   ├── building.md        # Build from source
│   ├── architecture.md    # Project architecture
│   └── contributing.md    # Contribution guide
└── api/
    └── cli.md             # CLI reference
```

### GitHub Pages Deployment

- Auto-deploy on push to `main` via GitHub Actions
- Custom domain support (optional)
- Search integration (local search)

### Content

- Installation screenshots
- Video tutorials (embedded YouTube)
- FAQ section
- Changelog

## [S9] Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Project scaffolding (Wails v3 + Vite)
- QEMU process manager (start/stop/status)
- Basic VM creation flow
- Simple VM list UI

### Phase 2: Core VM (Week 3-4)
- QMP monitor integration
- VNC display streaming
- Basic input handling (keyboard/mouse)
- Android image management

### Phase 3: ADB & Tools (Week 5-6)
- ADB client integration
- File manager UI
- APK installation
- Shell access
- Log viewer

### Phase 4: Advanced Features (Week 7-8)
- GPU acceleration (virtio-gpu)
- Gamepad support
- Key mapping editor
- Snapshot/restore
- Clipboard sync

### Phase 5: Polish & Docs (Week 9-10)
- UI refinement (dark theme, animations)
- System tray integration
- Documentation site
- GitHub Actions CI/CD
- Testing and bug fixes

## [S10] Platform-Specific Considerations

### Windows
- QEMU with WHPX (Windows Hypervisor Platform) or Hyper-V
- ADB bundled in `qemu/win-x64/`
- Windows Installer (NSIS or WiX)

### macOS
- QEMU with HVF (Hypervisor.framework)
- Universal binary (ARM64 + x86_64)
- macOS .app bundle with code signing
- Homebrew installation option

### Linux (Future)
- QEMU with KVM
- AppImage or .deb/.rpm packages
