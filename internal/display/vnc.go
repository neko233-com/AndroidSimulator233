package display

import (
	"fmt"
	"net"
	"time"
)

type VNCClient struct {
	host    string
	port    int
	conn    net.Conn
	quality int
}

type VNCConfig struct {
	Host    string
	Port    int
	Quality int // 0-9, higher = better quality
}

func NewVNCClient(config VNCConfig) *VNCClient {
	return &VNCClient{
		host:    config.Host,
		port:    config.Port,
		quality: config.Quality,
	}
}

func (c *VNCClient) Connect() error {
	addr := fmt.Sprintf("%s:%d", c.host, c.port)
	conn, err := net.DialTimeout("tcp", addr, 5*time.Second)
	if err != nil {
		return fmt.Errorf("VNC connection failed: %w", err)
	}
	c.conn = conn
	return nil
}

func (c *VNCClient) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *VNCClient) GetURL() string {
	return fmt.Sprintf("ws://%s:%d", c.host, c.port)
}
