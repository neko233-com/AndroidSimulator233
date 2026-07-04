# AndroidSimulator233

Open-source Android Simulator for desktop Android device management, supporting Windows and macOS.

## Features

- **Cross-Platform**: Windows 10/11 and macOS 12+
- **Gaming Optimized**: GPU acceleration, key mapping, gamepad support
- **Developer Friendly**: ADB integration, file manager, shell access, log viewer
- **Open Source**: MIT License

## Quick Install

### Windows

```powershell
# Run in PowerShell (as Administrator if needed)
irm https://raw.githubusercontent.com/neko233-com/AndroidSimulator233/main/scripts/install.ps1 | iex
```

Or download manually:
1. Download `install.ps1` from [scripts/](scripts/install.ps1)
2. Right-click → "Run with PowerShell"

### macOS

```bash
# Run in Terminal
curl -fsSL https://raw.githubusercontent.com/neko233-com/AndroidSimulator233/main/scripts/install.sh | bash
```

Or download manually:
1. Download `install.sh` from [scripts/](scripts/install.sh)
2. Run: `chmod +x install.sh && ./install.sh`

## Build from Source

### Prerequisites

- Go 1.26+
- Node.js 22+
- Wails v3 CLI

### Windows

```powershell
.\scripts\build.ps1
```

### macOS / Linux

```bash
./scripts/build.sh
```

## Usage

1. Launch AndroidSimulator233
2. Click "Create VM" to create a new Android instance
3. Select Android version (9, 12, or 14)
4. Click "Start" to boot the VM
5. Use ADB or the built-in tools to interact with Android

## Documentation

Visit [docs](https://neko233.github.io/AndroidSimulator233/) for full documentation.

## License

MIT License - see [LICENSE](LICENSE) for details.
