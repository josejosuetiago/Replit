const http = require('http');
const WebSocket = require('ws');

// Substitua pelo IP ou domínio da sua VPS
const VPS_HOST = "morescosapp.shop";
const VPS_PORT = 8080;

const server = http.createServer();

const wss = new WebSocket.Server({ server });

wss.on('connection', client => {
    const wsVPS = new WebSocket(`ws://${VPS_HOST}:${VPS_PORT}`);

    // Encaminhar mensagens do cliente para VPS
    client.on('message', msg => wsVPS.send(msg));

    // Encaminhar mensagens da VPS para o cliente
    wsVPS.on('message', msg => client.send(msg));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Proxy Replit rodando na porta ${PORT}`));
