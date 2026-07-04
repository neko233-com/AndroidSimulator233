//go:build !windows

package qemu

import "syscall"

func processAttributes() *syscall.SysProcAttr {
	return nil
}
