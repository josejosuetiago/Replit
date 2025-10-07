import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const TARGET = "wss://morescosapp.shop"; // Alvo do proxy (SSH/WS ou V2Ray)
const PORT = process.env.PORT || 8080;

// Log de requisições
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// Proxy principal
app.use(
  "/",
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    ws: true,
    secure: false,
    logLevel: "warn",
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader("Host", "morescosapp.shop");
      proxyReq.setHeader("Upgrade", req.headers.upgrade || "");
      proxyReq.setHeader("Connection", req.headers.connection || "");
    },
    onProxyRes: (proxyRes, req, res) => {
      if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === "websocket") {
        res.statusCode = 101;
      } else {
        res.statusCode = 200;
      }
    },
    onError(err, req, res) {
      console.error("[Proxy Error]", err.message);
      if (!res.headersSent) res.status(502).send("Bad Gateway");
    },
  })
);

// Endpoint de status
app.get("/status", (req, res) => {
  res.status(200).send("Proxy ativo e pronto 🚀");
});

// Keep Alive (ping a cada 10 minutos)
setInterval(() => {
  fetch("https://morescosapp.shop/status").catch(() => {});
  console.log("🔄 Keep-alive ping enviado");
}, 600000);

app.listen(PORT, () => {
  console.log(`✅ Proxy SSH/WS ativo na porta ${PORT} -> ${TARGET}`);
});
