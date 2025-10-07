import express from "express";
import fetch from "node-fetch";

const app = express();
const TARGET_IP = "45.140.193.48";

app.use(express.raw({ type: "*/*" })); // Para aceitar qualquer payload

app.all("/:porta/:path*", async (req, res) => {
  const { porta, path } = req.params;
  const url = `http://${TARGET_IP}:${porta}/${path || ""}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: req.headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });

    const data = await response.arrayBuffer();
    res.status(response.status);
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.send(Buffer.from(data));
  } catch (err) {
    res.status(500).send("Erro no proxy: " + err.message);
  }
});

app.get("/", (req, res) => {
  res.redirect(`http://${TARGET_IP}:80`);
});

// Mantém o servidor escutando
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Proxy ativo na porta ${PORT}`);
});
