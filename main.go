package main

import (
	"fmt"
	"io"
	"net"
	"os"
	"sync"
	"time"
)

var TargetAddr = "45.140.193.48" // IP da sua máquina com Xray

const (
	ServerAddr       = "0.0.0.0"
	ServerPort       = "8080"       // Porta que o contêiner vai expor
	TargetPort       = "80"         // Porta do Xray na sua máquina
	BufferSize       = 524288       // 512 KB
	KeepAliveTimeout = 24 * time.Hour
)

type Target struct {
	Addr  string
	Port  string
}

func createTarget() *Target {
	return &Target{Addr: TargetAddr, Port: TargetPort}
}

func copyStream(src, dst net.Conn, wg *sync.WaitGroup) {
	defer wg.Done()
	buffer := make([]byte, BufferSize)
	for {
		n, err := src.Read(buffer)
		if err != nil {
			if err != io.EOF {
				fmt.Printf("[ERROR] Erro ao transferir dados: %v\n", err)
			}
			break
		}
		if n > 0 {
			_, err := dst.Write(buffer[:n])
			if err != nil {
				fmt.Printf("[ERROR] Erro ao escrever dados: %v\n", err)
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

	target := createTarget()
	targetConn, err := net.Dial("tcp", net.JoinHostPort(target.Addr, target.Port))
	if err != nil {
		fmt.Printf("[ERROR] Falha ao conectar no alvo (%s:%s): %v\n", target.Addr, target.Port, err)
		return
	}
	defer targetConn.Close()

	var wg sync.WaitGroup
	wg.Add(2)

	go copyStream(client, targetConn, &wg)
	go copyStream(targetConn, client, &wg)
	go keepAlive(client, targetConn)

	wg.Wait()
	fmt.Printf("[INFO] Conexão encerrada: %s\n", clientAddr)
}

func main() {
	serverAddr := net.JoinHostPort(ServerAddr, ServerPort)
	listener, err := net.Listen("tcp", serverAddr)
	if err != nil {
		fmt.Printf("[FATAL] Falha ao iniciar o servidor: %v\n", err)
		os.Exit(1)
	}
	defer listener.Close()

	fmt.Printf("[INFO] Servidor escutando em %s, encaminhando para %s:%s\n", serverAddr, TargetAddr, TargetPort)

	for {
		client, err := listener.Accept()
		if err != nil {
			fmt.Printf("[ERROR] Falha ao aceitar conexão: %v\n", err)
			continue
		}
		go handleClient(client)
	}
}
