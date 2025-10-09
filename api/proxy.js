  import http from "http";
import net from "net";
import url from "url";

// IP da tua máquina com Xray
const TARGET_HOST = "45.140.193.48";

const server = http.createServer((req, res) => {
  const { pathname, search } = url.parse(req.url);
  let targetPort = 80; // padrão

  // Detecta prefixos
  const match = pathname.match(/^\/(\d+)(\/.*)?/);
  if (match) {
    targetPort = parseInt(match[1], 10);
  }

  const targetPath = match && match[2] ? match[2] : "/";
  const options = {
    host: TARGET_HOST,
    port: targetPort,
    path: targetPath + (search || ""),
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxyReq, { end: true });
  proxyReq.on("error", (err) => {
    res.writeHead(500);
    res.end("Proxy error: " + err.message);
  });
});

// Suporte CONNECT (tunel SSH/HTTPS)
server.on("connect", (req, clientSocket, head) => {
  const { port, hostname } = new URL(`http://${req.url}`);

  const serverSocket = net.connect(port || 80, hostname || TARGET_HOST, () => {
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on("error", () => clientSocket.end());
});

// Suporte WebSocket (Upgrade)
server.on("upgrade", (req, socket, head) => {
  const { pathname } = url.parse(req.url);
  const match = pathname.match(/^\/(\d+)(\/.*)?/);
  const targetPort = match ? parseInt(match[1], 10) : 80;

  const ws = net.connect(targetPort, TARGET_HOST, () => {
    ws.write(head);
    socket.pipe(ws);
    ws.pipe(socket);
  });

  ws.on("error", () => socket.end());
});

server.listen(8080, () => {
  console.log("✅ Proxy WebSocket/HTTP ativo na porta 8080");
});
