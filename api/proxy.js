import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

// IP e porta da sua máquina VPS
const target = "http://45.140.193.48:80";

app.use(
  "/",
  createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    onError: (err, req, res) => {
      console.error("Erro no proxy:", err.message);
      res.status(502).send("Falha ao conectar ao destino");
    }
  })
);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Proxy rodando em ${PORT} -> ${target}`));
