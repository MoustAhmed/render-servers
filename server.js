const express = require("express");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Store recent events in memory (debug-friendly)
const events = [];
const MAX_EVENTS = 200;

// Health check
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

// Home page: show latest received event in the browser
app.get("/", (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), MAX_EVENTS);
  const newestFirst = events.slice(-limit).reverse(); // stack: newest at top

  res
    .status(200)
    .type("json")
    .send(
      JSON.stringify(
        {
          ok: true,
          message: `Last ${newestFirst.length} ingested payloads (newest first). Use ?limit=100`,
          count: events.length,
          events: newestFirst,
        },
        null,
        2
      )
    );
});


// List page: show all recent events (newest first)
app.get("/events", (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), MAX_EVENTS);
  const newestFirst = [...events].slice(-limit).reverse();
  res.json({ ok: true, count: events.length, events: newestFirst });
});

// Receiver endpoint
app.post("/ingest", (req, res) => {
  const secret = process.env.EDGE_SHARED_SECRET;
  const got = req.headers["x-edge-secret"];

  if (!secret || got !== secret) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const evt = {
    ts: new Date().toISOString(),
    ip: req.body?.meta?.src_ip ?? null,
    attack_score: req.body?.attack_score ?? null,
    meta: req.body?.meta ?? null,
    flow: req.body?.flow ?? null,
    raw: req.body ?? null,
  };

  events.push(evt);
  if (events.length > MAX_EVENTS) events.shift();

  console.log("INGEST", evt.ts, evt.ip, evt.attack_score);

  return res.status(200).json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
