import http from "http";
import { request } from "node:http";

// IP e porta da sua VPS com Xray
const TARGET_HOST = "45.140.193.48";
const TARGET_PORT = 80;

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers
  };

  const proxy = request(options, res => {
    clientRes.writeHead(res.statusCode, res.headers);
    res.pipe(clientRes, { end: true });
  });

  proxy.on("error", err => {
    clientRes.writeHead(502, { "Content-Type": "text/plain" });
    clientRes.end("Proxy error: " + err.message);
  });

  clientReq.pipe(proxy, { end: true });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Proxy ativo na porta ${PORT}`));
