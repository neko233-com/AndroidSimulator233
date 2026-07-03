package qemu

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"sync"
)

type QMPClient struct {
	socketPath string
	conn       net.Conn
	reader     *bufio.Reader
	mu         sync.Mutex
}

type QMPResponse struct {
	Return interface{} `json:"return,omitempty"`
	Error  *QMPError   `json:"error,omitempty"`
}

type QMPError struct {
	Class string `json:"class"`
	Desc  string `json:"desc"`
}

func NewQMPClient(socketPath string) *QMPClient {
	return &QMPClient{
		socketPath: socketPath,
	}
}

func (c *QMPClient) Connect() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	conn, err := net.Dial("unix", c.socketPath)
	if err != nil {
		return fmt.Errorf("failed to connect to QMP: %w", err)
	}

	c.conn = conn
	c.reader = bufio.NewReader(conn)

	// Read capabilities
	_, err = c.readResponse()
	if err != nil {
		conn.Close()
		return fmt.Errorf("failed to read capabilities: %w", err)
	}

	// Send capabilities negotiation
	_, err = c.sendCommand(map[string]interface{}{
		"execute": "qmp_capabilities",
	})
	if err != nil {
		conn.Close()
		return fmt.Errorf("failed to negotiate capabilities: %w", err)
	}

	return nil
}

func (c *QMPClient) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *QMPClient) Execute(command string, args map[string]interface{}) (*QMPResponse, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	req := map[string]interface{}{
		"execute": command,
	}
	if args != nil {
		req["arguments"] = args
	}

	return c.sendCommand(req)
}

func (c *QMPClient) sendCommand(cmd map[string]interface{}) (*QMPResponse, error) {
	data, err := json.Marshal(cmd)
	if err != nil {
		return nil, err
	}

	_, err = c.conn.Write(append(data, '\n'))
	if err != nil {
		return nil, err
	}

	return c.readResponse()
}

func (c *QMPClient) readResponse() (*QMPResponse, error) {
	line, err := c.reader.ReadBytes('\n')
	if err != nil {
		return nil, err
	}

	var resp QMPResponse
	if err := json.Unmarshal(line, &resp); err != nil {
		return nil, err
	}

	if resp.Error != nil {
		return nil, fmt.Errorf("QMP error: %s - %s", resp.Error.Class, resp.Error.Desc)
	}

	return &resp, nil
}

func (c *QMPClient) QueryStatus() (string, error) {
	resp, err := c.Execute("query-status", nil)
	if err != nil {
		return "", err
	}

	status, ok := resp.Return.(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected response format")
	}

	return status["status"].(string), nil
}

func (c *QMPClient) Stop() error {
	_, err := c.Execute("stop", nil)
	return err
}

func (c *QMPClient) Cont() error {
	_, err := c.Execute("cont", nil)
	return err
}

func (c *QMPClient) Quit() error {
	_, err := c.Execute("quit", nil)
	return err
}

func (c *QMPClient) Screenshot(path string) error {
	_, err := c.Execute("screendump", map[string]interface{}{
		"filename": path,
	})
	return err
}
