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
