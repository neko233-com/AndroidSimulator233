package main

import (
	"embed"
	"fmt"
	"io"
	"log"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS
var appLogPath string

func main() {
	logFile, err := setupLogging()
	if err != nil {
		log.Fatal(err)
	}
	if logFile != nil {
		defer logFile.Close()
	}

	app := application.New(application.Options{
		Name:        "AndroidSimulator233",
		Description: "Open-source Android Simulator",
		Logger:      slog.New(slog.NewTextHandler(logFile, &slog.HandlerOptions{Level: slog.LevelInfo})),
		LogLevel:    slog.LevelInfo,
		Services: []application.Service{
			application.NewService(&App{}),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "AndroidSimulator233",
		Width:            1440,
		Height:           900,
		MinWidth:         1100,
		MinHeight:        720,
		InitialPosition:  application.WindowCentered,
		BackgroundColour: application.NewRGB(17, 24, 39),
		URL:              "/",
	})

	err = app.Run()
	if err != nil {
		log.Fatal(err)
	}
}

func setupLogging() (*os.File, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return nil, fmt.Errorf("resolve user config dir: %w", err)
	}

	logDir := filepath.Join(configDir, "AndroidSimulator233", "logs")
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return nil, fmt.Errorf("create log dir: %w", err)
	}

	appLogPath = filepath.Join(logDir, "app-"+time.Now().Format("2006-01-02")+".log")
	logFile, err := os.OpenFile(appLogPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return nil, fmt.Errorf("open log file: %w", err)
	}

	writer := io.Writer(logFile)
	log.SetOutput(writer)
	log.SetFlags(log.LstdFlags | log.Lmicroseconds | log.Lshortfile)
	os.Stdout = logFile
	os.Stderr = logFile

	log.Printf("AndroidSimulator233 started; log=%s", appLogPath)
	return logFile, nil
}
