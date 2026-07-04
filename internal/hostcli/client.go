package hostcli

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

type Client struct {
	path string
}

type Config struct {
	Name        string
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

type Info struct {
	Index            string `json:"index"`
	Name             string `json:"name"`
	IsMain           bool   `json:"is_main"`
	ErrorCode        int    `json:"error_code"`
	DiskSizeBytes    int64  `json:"disk_size_bytes"`
	CreatedTimestamp int64  `json:"created_timestamp"`
	IsAndroidStarted bool   `json:"is_android_started"`
	IsProcessStarted bool   `json:"is_process_started"`
	HyperVEnabled    bool   `json:"hyperv_enabled"`
}

type runtimeFile struct {
	CLIPath string `json:"cliPath"`
}

type setting struct {
	key   string
	value string
}

func NewClient() (*Client, error) {
	path, err := ResolveCLIPath()
	if err != nil {
		return nil, err
	}
	return &Client{path: path}, nil
}

func (c *Client) Path() string {
	return c.path
}

func ResolveCLIPath() (string, error) {
	candidates := []string{}
	if env := strings.TrimSpace(os.Getenv("ANDROIDSIM233_ENGINE_CLI")); env != "" {
		candidates = append(candidates, env)
	}

	for _, path := range runtimeConfigPaths() {
		config, err := readRuntimeFile(path)
		if err == nil && strings.TrimSpace(config.CLIPath) != "" {
			candidates = append(candidates, config.CLIPath)
		}
	}

	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate, nil
		}
	}
	return "", fmt.Errorf("host engine CLI is not configured")
}

func (c *Client) Info(index string) (*Info, error) {
	output, err := c.run(10*time.Second, "info", "--vmindex", index)
	if err != nil {
		return nil, err
	}
	infos, err := parseInfo(output)
	if err != nil {
		return nil, err
	}
	if len(infos) == 0 {
		return nil, fmt.Errorf("host engine returned no device info")
	}
	return &infos[0], nil
}

func (c *Client) InfoAll() ([]Info, error) {
	output, err := c.run(10*time.Second, "info", "--vmindex", "all")
	if err != nil {
		return nil, err
	}
	return parseInfo(output)
}

func (c *Client) EnsureIndex(index string) (string, error) {
	if strings.TrimSpace(index) == "" {
		index = "0"
	}
	if _, err := c.Info(index); err == nil {
		return index, nil
	}
	if index == "0" {
		return "", fmt.Errorf("host engine device 0 is unavailable")
	}

	before, _ := c.InfoAll()
	if _, err := c.run(60*time.Second, "create", "--number", "1"); err != nil {
		return "", err
	}
	after, err := c.InfoAll()
	if err != nil {
		return "", err
	}
	return newestIndex(before, after), nil
}

func (c *Client) Start(index string) error {
	_, err := c.run(45*time.Second, "control", "--vmindex", index, "launch")
	return err
}

func (c *Client) Stop(index string) error {
	_, err := c.run(30*time.Second, "control", "--vmindex", index, "shutdown")
	return err
}

func (c *Client) Restart(index string) error {
	_, err := c.run(45*time.Second, "control", "--vmindex", index, "restart")
	return err
}

func (c *Client) Rename(index, name string) error {
	if strings.TrimSpace(name) == "" {
		return nil
	}
	_, err := c.run(15*time.Second, "rename", "--vmindex", index, "--name", name)
	return err
}

func (c *Client) ApplyConfig(index string, config Config) error {
	settings := []setting{
		{"performance_mode", "custom"},
		{"performance_cpu.custom", strconv.Itoa(defaultInt(config.CPUs, 2))},
		{"performance_mem.custom", strconv.Itoa(defaultInt(ramGB(config.RAM), 2))},
		{"resolution_mode", "custom"},
		{"resolution_dpi.custom", strconv.Itoa(defaultInt(config.DPI, 240))},
		{"renderer_mode", rendererMode(config.Renderer)},
		{"renderer_strategy", rendererStrategy(config.Performance)},
		{"max_frame_rate", strconv.Itoa(defaultInt(config.MaxFPS, 60))},
		{"root_permission", strconv.FormatBool(config.Root)},
	}

	if width, height, ok := splitResolution(config.Resolution); ok {
		settings = append(settings,
			setting{"resolution_width.custom", strconv.Itoa(width)},
			setting{"resolution_height.custom", strconv.Itoa(height)},
		)
	}
	if config.Name != "" {
		settings = append(settings, setting{"player_name", config.Name})
	}
	if config.PhoneBrand != "" {
		settings = append(settings, setting{"phone_brand", config.PhoneBrand})
	}
	if config.PhoneModel != "" {
		settings = append(settings, setting{"phone_model", config.PhoneModel})
	}

	var failures []string
	for _, item := range settings {
		if err := c.Setting(index, item.key, item.value); err != nil {
			failures = append(failures, fmt.Sprintf("%s=%s: %v", item.key, item.value, err))
		}
	}
	if len(failures) > 0 {
		return fmt.Errorf("failed to apply host engine settings: %s", strings.Join(failures, "; "))
	}
	return nil
}

func (c *Client) Setting(index, key, value string) error {
	_, err := c.run(10*time.Second, "setting", "--vmindex", index, "--key", key, "--value", value)
	return err
}

func (c *Client) run(timeout time.Duration, args ...string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, c.path, args...)
	hideCommandWindow(cmd)
	output, err := cmd.CombinedOutput()
	trimmed := strings.TrimSpace(string(output))
	if ctx.Err() == context.DeadlineExceeded {
		return output, fmt.Errorf("host engine command timed out: %s", strings.Join(args, " "))
	}
	if err != nil {
		if trimmed == "" {
			trimmed = err.Error()
		}
		return output, fmt.Errorf("host engine command failed: %s: %s", strings.Join(args, " "), trimmed)
	}
	return output, nil
}

func runtimeConfigPaths() []string {
	paths := []string{}
	if appData := strings.TrimSpace(os.Getenv("APPDATA")); appData != "" {
		paths = append(paths, filepath.Join(appData, "AndroidSimulator233", "host-runtime.json"))
	}
	if localAppData := strings.TrimSpace(os.Getenv("LOCALAPPDATA")); localAppData != "" {
		paths = append(paths, filepath.Join(localAppData, "AndroidSimulator233", "host-runtime.json"))
	}
	if exe, err := os.Executable(); err == nil {
		paths = append(paths, filepath.Join(filepath.Dir(exe), "host-runtime.json"))
	}
	return paths
}

func readRuntimeFile(path string) (runtimeFile, error) {
	var config runtimeFile
	data, err := os.ReadFile(path)
	if err != nil {
		return config, err
	}
	data = bytes.TrimPrefix(data, []byte{0xEF, 0xBB, 0xBF})
	if err := json.Unmarshal(data, &config); err != nil {
		return config, err
	}
	return config, nil
}

func parseInfo(output []byte) ([]Info, error) {
	trimmed := strings.TrimSpace(string(output))
	if trimmed == "" {
		return nil, fmt.Errorf("empty host engine info response")
	}

	var infos []Info
	if strings.HasPrefix(trimmed, "[") {
		if err := json.Unmarshal([]byte(trimmed), &infos); err != nil {
			return nil, err
		}
		return infos, nil
	}

	var one Info
	if err := json.Unmarshal([]byte(trimmed), &one); err != nil {
		return nil, err
	}
	return []Info{one}, nil
}

func newestIndex(before, after []Info) string {
	beforeSet := map[string]bool{}
	for _, info := range before {
		beforeSet[info.Index] = true
	}
	sort.Slice(after, func(i, j int) bool {
		return after[i].CreatedTimestamp > after[j].CreatedTimestamp
	})
	for _, info := range after {
		if !beforeSet[info.Index] {
			return info.Index
		}
	}
	if len(after) > 0 {
		return after[0].Index
	}
	return "0"
}

func splitResolution(value string) (int, int, bool) {
	parts := strings.Split(strings.ToLower(strings.TrimSpace(value)), "x")
	if len(parts) != 2 {
		return 0, 0, false
	}
	width, widthErr := strconv.Atoi(strings.TrimSpace(parts[0]))
	height, heightErr := strconv.Atoi(strings.TrimSpace(parts[1]))
	if widthErr != nil || heightErr != nil || width <= 0 || height <= 0 {
		return 0, 0, false
	}
	return width, height, true
}

func ramGB(value string) int {
	value = strings.TrimSpace(strings.ToUpper(value))
	value = strings.TrimSuffix(value, "GB")
	value = strings.TrimSuffix(value, "G")
	gb, err := strconv.Atoi(value)
	if err != nil || gb <= 0 {
		return 0
	}
	return gb
}

func rendererMode(renderer string) string {
	switch strings.ToLower(strings.TrimSpace(renderer)) {
	case "directx", "dx", "d3d":
		return "dx"
	default:
		return "vk"
	}
}

func rendererStrategy(performance string) string {
	switch strings.ToLower(strings.TrimSpace(performance)) {
	case "high":
		return "perf"
	case "low":
		return "dis"
	default:
		return "auto"
	}
}

func defaultInt(value, fallback int) int {
	if value <= 0 {
		return fallback
	}
	return value
}
