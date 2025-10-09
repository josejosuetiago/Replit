import fetch from "node-fetch";
import http from "http";
import { URL } from "url";

const DOMAIN = "http://45.140.193.48"; // IP da tua máquina com Xray
const DEFAULT_PORT = 80; // porta padrão
const PORTS = {
  ssh: 22,
  xray: 80,
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let targetPath = url.pathname;
    let targetPort = DEFAULT_PORT;

    // Detecta prefixos tipo /ssh ou /xray
    if (targetPath.startsWith("/ssh")) {
      targetPort = PORTS.ssh;
      targetPath = targetPath.replace(/^\/ssh/, "");
    } else if (targetPath.startsWith("/xray")) {
      targetPort = PORTS.xray;
      targetPath = targetPath.replace(/^\/xray/, "");
    } else {
      // Detecta /<porta>/<caminho>
      const match = targetPath.match(/^\/(\d+)\/(.*)/);
      if (match) {
        targetPort = parseInt(match[1], 10);
        targetPath = "/" + match[2];
      }
    }

    const targetUrl = `${DOMAIN}:${targetPort}${targetPath}${url.search}`;

    console.log(`→ Redirecionando para ${targetUrl}`);

    const headers = { ...req.headers, Host: "45.140.193.48" };
    const options = {
      method: req.method,
      headers,
      redirect: "manual",
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      options.body = req;
    }

    const response = await fetch(targetUrl, options);

    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) response.body.pipe(res);
    else res.end();
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Erro no proxy: " + err.message);
  }
});

server.listen(8080, () => {
  console.log("🚀 Proxy rodando na porta 8080");
});
