package main

import (
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

var TargetAddr = "127.0.0.1"

const (
	ServerAddr       = "0.0.0.0"
	ServerPort       = "8080"
	TargetPortSSH    = "22"
	TargetPortV2Ray  = "8080"
	BufferSize       = 524288
	KeepAliveTimeout = 24 * time.Hour
)

type Target struct {
	Addr  string
	Port  string
	V2Ray bool
}

func createTarget(endpoint string) *Target {
	if endpoint == "/ws/" {
		return &Target{Addr: TargetAddr, Port: TargetPortV2Ray, V2Ray: true}
	}
	return &Target{Addr: TargetAddr, Port: TargetPortSSH, V2Ray: false}
}

func copyStream(src, dst net.Conn, wg *sync.WaitGroup, direction string) {
	defer wg.Done()
	buffer := make([]byte, BufferSize)
	for {
		n, err := src.Read(buffer)
		if err != nil {
			if err != io.EOF {
				fmt.Printf("[ERROR] %s: %v\n", direction, err)
			}
			break
		}
		if n > 0 {
			_, err := dst.Write(buffer[:n])
			if err != nil {
				fmt.Printf("[ERROR] %s write: %v\n", direction, err)
				break
			}
		}
	}
}

func keepAlive(conns ...net.Conn) {
	ticker := time.NewTicker(KeepAliveTimeout)
	defer ticker.Stop()
	for {
		<-ticker.C
		for _, conn := range conns {
			conn.SetDeadline(time.Now().Add(KeepAliveTimeout))
		}
	}
}

func handleClient(client net.Conn) {
	defer client.Close()
	clientAddr := client.RemoteAddr().String()
	fmt.Printf("[INFO] Cliente conectado: %s\n", clientAddr)

	buffer := make([]byte, BufferSize)
	size, err := client.Read(buffer)
	if err != nil {
		fmt.Printf("[ERROR] Ler do cliente %s: %v\n", clientAddr, err)
		return
	}

	payload := string(buffer[:size])
	endpoint := strings.Split(payload, " ")[1]
	target := createTarget(endpoint)

	targetConn, err := net.Dial("tcp", net.JoinHostPort(target.Addr, target.Port))
	if err != nil {
		fmt.Printf("[ERROR] Conectar alvo %s:%s: %v\n", target.Addr, target.Port, err)
		return
	}
	defer targetConn.Close()

	if target.V2Ray {
		targetConn.Write(buffer[:size])
	} else {
		client.Write([]byte("HTTP/1.1 101 Switching Protocols\r\nUpgrade: Websocket\r\nConnection: Upgrade\r\n\r\n"))
	}

	var wg sync.WaitGroup
	wg.Add(2)
	go copyStream(client, targetConn, &wg, "Cliente->Alvo")
	go copyStream(targetConn, client, &wg, "Alvo->Cliente")
	go keepAlive(client, targetConn)
	wg.Wait()
	fmt.Printf("[INFO] Conexão encerrada: %s\n", clientAddr)
}

func main() {
	go func() {
		// Health check HTTP para Koyeb
		http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(200)
			w.Write([]byte("OK 🚀"))
		})
		http.ListenAndServe(":8081", nil) // Porta HTTP para health check
	}()

	serverAddr := net.JoinHostPort(ServerAddr, ServerPort)
	listener, err := net.Listen("tcp", serverAddr)
	if err != nil {
		fmt.Printf("[FATAL] Falha ao iniciar servidor: %v\n", err)
		os.Exit(1)
	}
	defer listener.Close()

	fmt.Printf("[INFO] Servidor TCP escutando em %s\n", serverAddr)

	for {
		client, err := listener.Accept()
		if err != nil {
			fmt.Printf("[ERROR] Aceitar conexão: %v\n", err)
			continue
		}
		go handleClient(client)
	}
}
