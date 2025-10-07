import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

// IP e porta da sua máquina (VPS)
const target = "http://45.140.193.48:80";

// Cria o proxy fixo
app.use(
  "/",
  createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader("X-Forwarded-For", req.ip);
    },
    onError: (err, req, res) => {
      console.error("Erro no proxy:", err.message);
      res.status(502).send("Erro ao conectar ao servidor de destino");
    }
  })
);

// Inicia o servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Proxy rodando na porta ${PORT} -> ${target}`);
});
