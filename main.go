package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := application.New(application.Options{
		Name:        "AndroidSimulator233",
		Description: "Open-source Android Simulator",
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
		BackgroundColour: application.NewRGB(17, 24, 39),
		URL:              "/",
	})

	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
