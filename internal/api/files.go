package api

import (
	"strconv"
	"strings"

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
	lines := splitLines(output)
	for i, line := range lines {
		if i < 2 { // skip "total N" and "."
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 8 {
			continue
		}
		isDir := fields[0][0] == 'd'
		name := strings.Join(fields[7:], " ")
		if name == ".." || name == "." {
			continue
		}
		size, _ := strconv.ParseInt(fields[4], 10, 64)
		files = append(files, FileEntry{
			Name:  name,
			Size:  size,
			IsDir: isDir,
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
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			lines = append(lines, s[start:i])
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}
