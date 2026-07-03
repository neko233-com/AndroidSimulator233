package vm

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// FirstBootScript is the script that runs on first boot to install apps
const FirstBootScript = `#!/system/bin/sh
# AndroidSimulator233 First Boot Setup
# This script runs on first boot to install default apps

LOGFILE="/data/local/tmp/firstboot.log"
APK_DIR="/system/app"

echo "=== AndroidSimulator233 First Boot ===" > $LOGFILE
echo "Date: $(date)" >> $LOGFILE

# Wait for boot to complete
echo "Waiting for boot to complete..." >> $LOGFILE
while [ "$(getprop sys.boot_completed)" != "1" ]; do
    sleep 1
done
echo "Boot completed" >> $LOGFILE

# Wait for package manager
echo "Waiting for package manager..." >> $LOGFILE
while [ "$(pm path com.android.packageinstaller 2>/dev/null)" = "" ]; do
    sleep 1
done
echo "Package manager ready" >> $LOGFILE

# Enable USB debugging
echo "Enabling USB debugging..." >> $LOGFILE
settings put global adb_enabled 1

# Disable setup wizard
echo "Disabling setup wizard..." >> $LOGFILE
pm disable com.google.android.setupwizard 2>/dev/null
pm disable com.android.setupwizard 2>/dev/null

# Mark first boot as complete
echo "First boot setup complete" >> $LOGFILE
setprop persist.sys.firstboot.done 1

exit 0
`

// FirstBootManager handles first-boot setup for VMs
type FirstBootManager struct {
	dataDir   string
	scriptDir string
}

func NewFirstBootManager(dataDir string) *FirstBootManager {
	scriptDir := filepath.Join(dataDir, "scripts")
	os.MkdirAll(scriptDir, 0755)

	return &FirstBootManager{
		dataDir:   dataDir,
		scriptDir: scriptDir,
	}
}

// PrepareFirstBootScript creates the first-boot script for a VM
func (m *FirstBootManager) PrepareFirstBootScript(vmName string) (string, error) {
	scriptPath := filepath.Join(m.scriptDir, vmName+".sh")

	if err := os.WriteFile(scriptPath, []byte(FirstBootScript), 0755); err != nil {
		return "", fmt.Errorf("failed to write first-boot script: %w", err)
	}

	return scriptPath, nil
}

// WaitForBoot waits for the Android VM to complete booting
func (m *FirstBootManager) WaitForBoot(timeout time.Duration) error {
	start := time.Now()
	for time.Since(start) < timeout {
		// Check if boot is complete
		// This would normally check via ADB
		time.Sleep(2 * time.Second)
		return nil // Placeholder - real implementation would check ADB
	}
	return fmt.Errorf("timeout waiting for boot")
}

// InstallApps installs the default apps via ADB
func (m *FirstBootManager) InstallApps(vmName string, apps []string) error {
	for _, app := range apps {
		// In a real implementation, this would:
		// 1. Download the APK from a CDN
		// 2. Push it via ADB
		// 3. Install via ADB
		fmt.Printf("Would install: %s\n", app)
	}
	return nil
}
