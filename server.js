const express = require("express");
const app = express();

app.use(express.json({ limit: "1mb" }));

const events = [];
const MAX_EVENTS = 200;

// Health check
app.get("/health", (req, res) => res.status(200).send("ok"));

// JSON feed (used by the UI)
app.get("/events", (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), MAX_EVENTS);
  const newestFirst = events.slice(-limit).reverse();
  res.json({ ok: true, count: events.length, events: newestFirst });
});

// Nice UI page
app.get("/", (req, res) => {
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>NetSafe Receiver</title>
  <style>
    :root{
      --bg:#0b1020;
      --panel:#0f1733;
      --panel2:#0c132c;
      --border:rgba(255,255,255,.08);
      --text:rgba(255,255,255,.92);
      --muted:rgba(255,255,255,.60);
      --good:rgba(34,197,94,.95);
      --warn:rgba(245,158,11,.95);
      --bad:rgba(239,68,68,.95);
      --chip:#111a39;
      --shadow: 0 18px 60px rgba(0,0,0,.35);
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      background: radial-gradient(1200px 700px at 20% -10%, rgba(99,102,241,.25), transparent 55%),
                  radial-gradient(900px 600px at 90% 0%, rgba(34,197,94,.12), transparent 60%),
                  var(--bg);
      color:var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    }
    .wrap{max-width:1100px;margin:0 auto;padding:24px 16px 48px}
    .topbar{
      display:flex;align-items:flex-start;justify-content:space-between;gap:16px;
      margin-bottom:18px;
    }
    .title{display:flex;flex-direction:column;gap:6px}
    .title h1{margin:0;font-size:20px;letter-spacing:.2px}
    .title .sub{color:var(--muted);font-size:13px}
    .controls{
      display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end;
    }
    .pill{
      background:rgba(255,255,255,.06);
      border:1px solid var(--border);
      border-radius:999px;
      padding:8px 10px;
      display:flex;gap:10px;align-items:center;
      box-shadow:0 6px 30px rgba(0,0,0,.15);
    }
    .pill label{font-size:12px;color:var(--muted)}
    .pill input,.pill select{
      background:transparent;border:none;outline:none;color:var(--text);
      font-size:12px;
    }
    .pill input{width:74px}
    .btn{
      cursor:pointer;
      background:rgba(255,255,255,.08);
      border:1px solid var(--border);
      color:var(--text);
      padding:9px 12px;
      border-radius:12px;
      font-size:12px;
    }
    .btn:hover{background:rgba(255,255,255,.10)}
    .grid{
      display:grid;
      grid-template-columns: 1.2fr .8fr;
      gap:14px;
    }
    @media (max-width: 920px){
      .grid{grid-template-columns:1fr}
    }
    .card{
      background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
      border:1px solid var(--border);
      border-radius:16px;
      box-shadow:var(--shadow);
      overflow:hidden;
    }
    .cardHead{
      padding:14px 14px 10px;
      display:flex;justify-content:space-between;align-items:center;gap:8px;
      border-bottom:1px solid rgba(255,255,255,.06);
      background:rgba(0,0,0,.12);
    }
    .cardHead .h{font-size:13px;color:var(--muted)}
    .kpi{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:flex-end}
    .kpi .mini{
      background:rgba(0,0,0,.14);
      border:1px solid rgba(255,255,255,.06);
      padding:6px 10px;border-radius:12px;
      font-size:12px;color:var(--muted);
    }
    .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace}
    .list{padding:10px; display:flex; flex-direction:column; gap:10px; max-height:70vh; overflow:auto}
    .item{
      background:linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.10));
      border:1px solid rgba(255,255,255,.06);
      border-radius:14px;
      padding:12px;
    }
    .row{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}
    .badges{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .badge{
      background:var(--chip);
      border:1px solid rgba(255,255,255,.08);
      color:var(--muted);
      padding:4px 8px;border-radius:999px;
      font-size:11px;
    }
    .score{
      font-weight:700;
      letter-spacing:.2px;
    }
    .score.good{color:var(--good)}
    .score.warn{color:var(--warn)}
    .score.bad{color:var(--bad)}
    pre{
      margin:10px 0 0;
      padding:10px;
      background:rgba(0,0,0,.18);
      border:1px solid rgba(255,255,255,.06);
      border-radius:12px;
      color:rgba(255,255,255,.85);
      overflow:auto;
      font-size:11px;
      line-height:1.45;
    }
    .side{padding:12px}
    .side .hint{color:var(--muted);font-size:12px;line-height:1.5}
    .side code{background:rgba(255,255,255,.06); padding:2px 6px;border-radius:8px;border:1px solid rgba(255,255,255,.07)}
    .hr{height:1px;background:rgba(255,255,255,.06);margin:12px 0}
    .toast{color:var(--muted);font-size:12px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div class="title">
        <h1>NetSafe Receiver <span class="mono" style="color:rgba(255,255,255,.45);font-weight:500">/ingest</span></h1>
        <div class="sub">Live feed from Vercel Edge → Render. Refreshes automatically.</div>
      </div>

      <div class="controls">
        <div class="pill">
          <label>Auto</label>
          <select id="auto">
            <option value="on" selected>ON</option>
            <option value="off">OFF</option>
          </select>
        </div>
        <div class="pill">
          <label>Every</label>
          <input id="ms" type="number" min="250" step="250" value="1000" />
          <span class="mono" style="color:rgba(255,255,255,.5);font-size:12px">ms</span>
        </div>
        <div class="pill">
          <label>Show</label>
          <input id="limit" type="number" min="1" max="${MAX_EVENTS}" value="50" />
        </div>
        <button class="btn" id="refresh">Refresh</button>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="cardHead">
          <div class="h">Incoming events (newest first)</div>
          <div class="kpi">
            <div class="mini">Total: <span class="mono" id="total">0</span></div>
            <div class="mini">Last IP: <span class="mono" id="lastip">—</span></div>
            <div class="mini">Last score: <span class="mono" id="lastscore">—</span></div>
          </div>
        </div>
        <div class="list" id="list">
          <div class="toast">Waiting for events…</div>
        </div>
      </div>

      <div class="card">
        <div class="cardHead">
          <div class="h">How to use</div>
          <div class="mono" style="color:rgba(255,255,255,.45);font-size:12px">GET /events</div>
        </div>
        <div class="side">
          <div class="hint">
            This page polls <code>/events?limit=N</code> and renders cards.<br/>
            If your free Render service sleeps, data resets (in-memory).
          </div>

          <div class="hr"></div>

          <div class="hint">
            Try:
            <div style="margin-top:8px" class="mono">
              <div>GET <span style="color:rgba(255,255,255,.85)">/events?limit=50</span></div>
              <div>GET <span style="color:rgba(255,255,255,.85)">/health</span></div>
            </div>
          </div>

          <div class="hr"></div>

          <div class="hint">
            Tip: If you want persistence, swap memory for Redis/Postgres later.
          </div>
        </div>
      </div>
    </div>
  </div>

<script>
  const elList = document.getElementById("list");
  const elTotal = document.getElementById("total");
  const elLastIp = document.getElementById("lastip");
  const elLastScore = document.getElementById("lastscore");

  const elAuto = document.getElementById("auto");
  const elMs = document.getElementById("ms");
  const elLimit = document.getElementById("limit");
  const elRefresh = document.getElementById("refresh");

  function scoreClass(score){
    if (typeof score !== "number" || !isFinite(score)) return "";
    if (score >= 0.85) return "bad";
    if (score >= 0.60) return "warn";
    return "good";
  }

  function safe(v){
    if (v === null || v === undefined) return "—";
    if (typeof v === "string" && v.trim() === "") return "—";
    return v;
  }

  function fmt(n){
    if (typeof n !== "number" || !isFinite(n)) return "—";
    return Math.round(n * 1000) / 1000;
  }

  function render(data){
    elTotal.textContent = data.count ?? 0;

    const events = data.events || [];
    const latest = events[0] || null;
    elLastIp.textContent = latest?.ip || latest?.meta?.src_ip || "—";
    elLastScore.textContent = fmt(latest?.attack_score);

    if (!events.length){
      elList.innerHTML = '<div class="toast">Waiting for events…</div>';
      return;
    }

    elList.innerHTML = events.map((e) => {
      const ip = e.ip || e.meta?.src_ip;
      const path = e.meta?.path;
      const ua = e.meta?.ua;
      const score = e.attack_score;
      const ts = e.ts;
      const cls = scoreClass(score);

      const metaBadges = [
        ip ? '<span class="badge mono">ip: ' + ip + '</span>' : '',
        path ? '<span class="badge mono">path: ' + path + '</span>' : '',
        ua ? '<span class="badge mono">ua: ' + ua + '</span>' : '',
        (e.meta && e.meta.is_bot_like !== undefined) ? '<span class="badge mono">bot_like: ' + e.meta.is_bot_like + '</span>' : ''
      ].filter(Boolean).join("");

      const pretty = JSON.stringify(e.raw ?? e, null, 2);

      return \`
        <div class="item">
          <div class="row">
            <div class="badges">
              <span class="badge mono">ts: \${safe(ts)}</span>
              \${metaBadges}
            </div>
            <div class="mono score \${cls}">score: \${fmt(score)}</div>
          </div>
          <pre class="mono">\${pretty}</pre>
        </div>
      \`;
    }).join("");
  }

  async function load(){
    const limit = Math.min(Math.max(parseInt(elLimit.value || "50", 10), 1), ${MAX_EVENTS});
    const r = await fetch("/events?limit=" + limit, { cache: "no-store" });
    const data = await r.json();
    render(data);
  }

  let timer = null;
  function start(){
    stop();
    timer = setInterval(() => {
      if (elAuto.value === "on") load().catch(()=>{});
    }, Math.max(parseInt(elMs.value || "1000", 10), 250));
  }
  function stop(){ if (timer) clearInterval(timer); timer = null; }

  elRefresh.addEventListener("click", () => load());
  elAuto.addEventListener("change", () => start());
  elMs.addEventListener("change", () => start());
  elLimit.addEventListener("change", () => load());

  load().finally(start);
</script>
</body>
</html>`);
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on", PORT));
