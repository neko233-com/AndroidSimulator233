package qemu

import (
	"fmt"
	"runtime"
	"strings"
)

type QEMUConfig struct {
	Name           string
	CPUs           int
	RAM            string
	Disk           string
	Display        string
	Resolution     string
	Renderer       string
	Performance    string
	MaxFPS         int
	GPU            string
	Network        string
	ADBPort        int
	KVM            bool
	UseSDKEmulator bool
	AVDName        string
	LogDir         string
}

func (c *QEMUConfig) BuildArgs() []string {
	renderer := strings.ToLower(defaultString(c.Renderer, "vulkan"))
	if renderer != "vulkan" {
		renderer = "vulkan"
	}
	cpus := c.CPUs
	if cpus <= 0 {
		cpus = 6
	}
	ram := defaultString(c.RAM, "12G")

	args := []string{
		"-name", defaultString(c.Name, "AndroidSimulator233"),
		"-machine", accelerationMachine(),
		"-cpu", accelerationCPU(),
		"-m", ram,
		"-smp", fmt.Sprintf("%d,sockets=1,cores=%d,threads=1", cpus, cpus),
		"-drive", fmt.Sprintf("file=%s,if=virtio,format=qcow2", c.Disk),
		"-device", vulkanGPUDevice(c.Performance),
		"-netdev", fmt.Sprintf("user,id=net0,hostfwd=tcp::%d-:5555", c.ADBPort),
		"-device", "virtio-net-pci,netdev=net0",
		"-serial", "none",
		"-audiodev", "none",
		"-rtc", "base=localtime,clock=host",
		"-boot", "menu=off,strict=off",
	}

	if c.Display == "" || c.Display == "window" {
		args = append(args, "-display", vulkanDisplay())
	} else {
		args = append(args, "-display", c.Display)
	}

	if c.KVM && isKVMSupported() {
		args = append(args, "-enable-kvm")
	}

	return args
}

func accelerationMachine() string {
	switch runtime.GOOS {
	case "linux":
		return "q35,accel=kvm:tcg"
	case "darwin":
		return "q35,accel=hvf:tcg"
	case "windows":
		return "q35,accel=whpx:tcg"
	default:
		return "q35"
	}
}

func accelerationCPU() string {
	if isKVMSupported() {
		return "host"
	}
	return "max"
}

func vulkanGPUDevice(performance string) string {
	if strings.EqualFold(performance, "high") || strings.EqualFold(performance, "extreme") || strings.EqualFold(performance, "custom") {
		return "virtio-vga-gl,blob=true,hostmem=2048M"
	}
	return "virtio-vga-gl,blob=true,hostmem=1024M"
}

func vulkanDisplay() string {
	switch runtime.GOOS {
	case "windows":
		return "sdl,gl=on"
	default:
		return "gtk,gl=on"
	}
}

func defaultString(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func isKVMSupported() bool {
	switch runtime.GOOS {
	case "linux":
		return true // KVM
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
