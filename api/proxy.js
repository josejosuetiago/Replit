import fetch from "node-fetch";

export default async function handler(req, res) {
  const { porta, path } = req.query;

  if (!porta) {
    res.status(400).send("Porta não especificada");
    return;
  }

  const url = `http://45.140.193.48:${porta}/${path || ""}`;

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
}
