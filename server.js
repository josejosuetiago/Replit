const http = require('http');
const WebSocket = require('ws');
const net = require('net');

const TARGET_HOST = process.env.TARGET_HOST || '45.83.12.10';
const SSH_PORT = process.env.SSH_PORT || 80;
const XRAY_PORT = process.env.XRAY_PORT || 8080;

const server = http.createServer((req, res) => {
  // Para conexões HTTP normais (SSH Injector, etc)
  const target = net.connect(SSH_PORT, TARGET_HOST, () => {
    req.pipe(target);
    target.pipe(res);
  });

  target.on('error', err => {
    res.writeHead(502);
    res.end('Bad Gateway: ' + err.message);
  });
});

// Configura WebSocket para Xray/V2Ray
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('Nova conexão WS de', req.socket.remoteAddress);
  const target = net.connect(XRAY_PORT, TARGET_HOST);

  ws.on('message', msg => target.write(msg));
  target.on('data', data => ws.send(data));
  target.on('close', () => ws.close());
  ws.on('close', () => target.end());
  ws.on('error', () => target.end());
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
