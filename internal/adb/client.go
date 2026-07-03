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
