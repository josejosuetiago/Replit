import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.raw({ type: "*/*", limit: "50mb" })); // para aceitar body binário

const TARGET_IP = "45.140.193.48"; // sua máquina
const DEFAULT_PORT = "80";          // porta padrão caso não seja passada

// Rota para proxy dinâmico: /porta/qualquer/caminho
app.all("/:porta/*", async (req, res) => {
  const porta = req.params.porta || DEFAULT_PORT;
  const path = req.params[0] || "";
  const url = `http://${TARGET_IP}:${porta}/${path}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: req.headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });

    const data = await response.arrayBuffer();

    // Replicar headers do backend
    response.headers.forEach((v, k) => {
      res.setHeader(k, v);
    });

    res.status(response.status);
    res.send(Buffer.from(data));
  } catch (err) {
    res.status(500).send("Erro no proxy: " + err.message);
  }
});

// Proxy raiz opcional: /
app.all("/", async (req, res) => {
  const url = `http://${TARGET_IP}:${DEFAULT_PORT}`;
  try {
    const response = await fetch(url, { method: req.method, headers: req.headers });
    const data = await response.arrayBuffer();
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.status(response.status);
    res.send(Buffer.from(data));
  } catch (err) {
    res.status(500).send("Erro no proxy: " + err.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`[INFO] Proxy rodando na porta ${PORT}, redirecionando para ${TARGET_IP}`);
});
