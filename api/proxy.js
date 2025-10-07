import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.raw({ type: "*/*", limit: "50mb" }));

const TARGET_IP = "45.140.193.48"; // sua máquina
const DEFAULT_PORT = "80"; // porta padrão

// Proxy dinâmico: /porta/qualquer/coisa
app.all("/:porta/:path(*)", async (req, res) => {
  const porta = req.params.porta || DEFAULT_PORT;
  const path = req.params.path || "";
  const url = `http://${TARGET_IP}:${porta}/${path}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: req.headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });

    const data = await response.arrayBuffer();
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.status(response.status).send(Buffer.from(data));
  } catch (err) {
    res.status(500).send("Erro no proxy: " + err.message);
  }
});

// Proxy raiz
app.all("/", async (req, res) => {
  const url = `http://${TARGET_IP}:${DEFAULT_PORT}`;
  try {
    const response = await fetch(url, { method: req.method, headers: req.headers });
    const data = await response.arrayBuffer();
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.status(response.status).send(Buffer.from(data));
  } catch (err) {
    res.status(500).send("Erro no proxy: " + err.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`[INFO] Proxy ativo na porta ${PORT}, redirecionando para ${TARGET_IP}:${DEFAULT_PORT}`);
});
