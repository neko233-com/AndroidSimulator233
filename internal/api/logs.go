package api

import (
	"bufio"
	"fmt"
	"os/exec"
	"strconv"
	"strings"

	"github.com/neko233/AndroidSimulator233/internal/adb"
)

// sanitizeLogcatFilter validates that a logcat filter expression contains only
// safe characters. Allowed: alphanumeric, * : . _ - and space (for separating
// multiple filter specs).
func sanitizeLogcatFilter(filter string) (string, error) {
	for _, c := range filter {
		if !((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') ||
			c == '*' || c == ':' || c == '.' || c == '_' || c == '-' || c == ' ') {
			return "", fmt.Errorf("invalid character in logcat filter: %q", string(c))
		}
	}
	return filter, nil
}

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
	safeFilter, err := sanitizeLogcatFilter(filter)
	if err != nil {
		return nil, fmt.Errorf("invalid filter: %w", err)
	}
	cmd := fmt.Sprintf("logcat -d %s", safeFilter)
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
	args := []string{"-s", deviceID, "logcat"}
	if filter != "" {
		safeFilter, err := sanitizeLogcatFilter(filter)
		if err != nil {
			return nil, fmt.Errorf("invalid filter: %w", err)
		}
		args = append(args, strings.Fields(safeFilter)...)
	}
	cmd := exec.Command(a.adb.GetPath(), args...)
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
	// Format: "MM-DD HH:MM:SS.mmm  PID  TID LEVEL TAG: MESSAGE"
	if len(line) < 20 {
		return nil
	}

	colonIdx := strings.Index(line, ": ")
	if colonIdx < 0 {
		return nil
	}

	header := line[:colonIdx]
	message := strings.TrimSpace(line[colonIdx+2:])

	// Find the log level character - it's the last single-char field before TAG
	// Typical format ends with "LEVEL TAG:"
	parts := strings.Fields(header)
	if len(parts) < 6 {
		return nil
	}

	level := parts[4]
	if len(level) != 1 || !strings.Contains("VDIWEF", level) {
		level = "I"
	}

	tag := parts[5]

	pid, _ := strconv.Atoi(parts[2])

	return &LogEntry{
		Level:   level,
		Tag:     tag,
		Message: message,
		PID:     pid,
	}
}
