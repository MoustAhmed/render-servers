const express = require("express");
const app = express();
app.use(express.json({ limit: "1mb" }));

const events = [];
const MAX_EVENTS = 500; // keep last 500

app.get("/health", (req, res) => res.send("ok"));

app.get("/events", (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 500);
  res.json({
    ok: true,
    count: events.length,
    events: events.slice(-limit).reverse(), // newest first
  });
});

app.post("/ingest", (req, res) => {
  const secret = process.env.EDGE_SHARED_SECRET;
  const got = req.headers["x-edge-secret"];

  if (!secret || got !== secret) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const evt = {
    ts: new Date().toISOString(),
    ip: req.body?.meta?.src_ip ?? null,
    meta: req.body?.meta ?? null,
    flow: req.body?.flow ?? null,
    attack_score: req.body?.attack_score ?? null,
  };

  events.push(evt);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);

  console.log("INGEST", evt.ts, evt.ip, evt.attack_score);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
