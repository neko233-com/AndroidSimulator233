//go:build !windows

package hostcli

import "os/exec"

func hideCommandWindow(cmd *exec.Cmd) {}
