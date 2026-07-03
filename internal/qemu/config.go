package qemu

import (
	"fmt"
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
		"-device", "virtio-vga-gl",
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
