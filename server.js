const express = require("express");

const app = express();
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.send("ok");
});

// Receiver endpoint
app.post("/ingest", (req, res) => {
  const secret = process.env.EDGE_SHARED_SECRET;
  const header = req.headers["x-edge-secret"];

  if (!secret || header !== secret) {
    return res.status(401).json({ error: "unauthorized" });
  }

  console.log("Received:", req.body);

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
