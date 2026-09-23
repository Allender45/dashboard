const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const fs = require("fs");
const https = require("https");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");

const { getDb } = require("./db");
const { signToken, authRequired } = require("./auth");

const PORT = Number(process.env.PORT || 4000);
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads");

const NEWS_UPLOADS_SUBDIR = "news";
const NEWS_UPLOADS_DIR = path.join(UPLOADS_DIR, NEWS_UPLOADS_SUBDIR);

// ---------- Battle portal frame proxy ----------
const BATTLE_ORIGIN = process.env.BATTLE_ORIGIN || "https://razportal.duckdns.org";
const BATTLE_GUEST_KEY = process.env.BATTLE_GUEST_KEY || "";

const MUSIC_UPLOADS_DIR = path.join(UPLOADS_DIR, "music");
fs.mkdirSync(MUSIC_UPLOADS_DIR, { recursive: true });

fs.mkdirSync(NEWS_UPLOADS_DIR, { recursive: true });

function pad2(n) {
  return String(n).padStart(2, "0");
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

function formatTimestampForFilename(d) {
  return (
    String(d.getFullYear()) +
    pad2(d.getMonth() + 1) +
    pad2(d.getDate()) +
    "_" +
    pad2(d.getHours()) +
    pad2(d.getMinutes()) +
    pad2(d.getSeconds()) +
    "_" +
    pad3(d.getMilliseconds())
  );
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, NEWS_UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ts = formatTimestampForFilename(new Date());
    const safeBase = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 80);
    const ext = path.extname(safeBase);
    const base = path.basename(safeBase, ext);
    const name = `${ts}_${base}${ext}`;
    cb(null, name);
  },
});

const musicStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MUSIC_UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ts = formatTimestampForFilename(new Date());
    const safeBase = path
        .basename(file.originalname)
        .replace(/[^a-zA-Z0-9._-]+/g, "_")
        .slice(0, 80);
    const ext = path.extname(safeBase);
    const base = path.basename(safeBase, ext);
    const name = `${ts}_${base}${ext}`;
    cb(null, name);
  },
});

const uploadMusic = multer({ storage: musicStorage });

const upload = multer({ storage });

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

function proxyUpstreamJson(res, upstreamUrl, token, tokenHeaderName) {
  function requestUpstream(url, redirectsLeft) {
    if (url.protocol !== "https:") {
      return res.status(500).json({ error: "Upstream URL must be https" });
    }

    const reqUpstream = https.request(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port ? Number(url.port) : 443,
          path: `${url.pathname}${url.search}`,
          method: "GET",
          headers: {
            [tokenHeaderName]: token,
            Accept: "application/json",
            "User-Agent": "dashboard-proxy/1.0",
          },
          timeout: 10_000,
        },
        (r) => {
          let body = "";
          r.setEncoding("utf8");
          r.on("data", (chunk) => {
            body += chunk;
          });
          r.on("end", () => {
            const status = r.statusCode || 0;
            const location = r.headers?.location;

            if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
              try {
                const nextUrl = new URL(location, url);
                return requestUpstream(nextUrl, redirectsLeft - 1);
              } catch {
                return res.status(502).json({
                  error: "Upstream redirect has invalid location",
                  upstreamStatus: status,
                  upstreamLocation: String(location),
                });
              }
            }

            if (status >= 200 && status < 300) {
              try {
                const data = JSON.parse(body);
                return res.json(data);
              } catch {
                return res.status(502).json({
                  error: "Upstream returned invalid JSON",
                  upstreamStatus: status,
                  upstreamBody: String(body || "").slice(0, 2000),
                });
              }
            }

            return res.status(502).json({
              error: "Upstream error",
              upstreamStatus: status,
              upstreamBody: String(body || "").slice(0, 2000),
            });
          });
        },
    );

    reqUpstream.on("timeout", () => {
      reqUpstream.destroy(new Error("Upstream timeout"));
    });

    reqUpstream.on("error", (e) => {
      return res.status(502).json({ error: "Upstream request failed", details: String(e?.message || e) });
    });

    reqUpstream.end();
  }

  requestUpstream(upstreamUrl, 5);
}

app.get("/api/public/contest-tv/results", async (_req, res) => {
  const CONTEST_TV_URL = process.env.CONTEST_TV_URL || "https://xn--80aaijde3bzad4a.xn--p1ai/contest-tv/results";
  const token = process.env.CONTEST_TV_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "CONTEST_TV_TOKEN is not configured" });
  }
  const url = new URL(CONTEST_TV_URL);
  return proxyUpstreamJson(res, url, token, "X-Contest-Tv-Token");
});

app.get("/api/public/team-battle-leaderboard", async (_req, res) => {
  const TEAM_BATTLE_LEADERBOARD_URL =
      process.env.TEAM_BATTLE_LEADERBOARD_URL || "https://xn--80aaijde3bzad4a.xn--p1ai/showcase-api/team-battle-leaderboard/";
  const token = process.env.CONTEST_TV_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "CONTEST_TV_TOKEN is not configured" });
  }
  const url = new URL(TEAM_BATTLE_LEADERBOARD_URL);
  return proxyUpstreamJson(res, url, token, "X-Contest-Tv-Token");
});

app.post("/api/auth/login", async (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) {
    return res.status(400).json({ error: "login and password are required" });
  }

  const db = await getDb();
  const user = await db.get("SELECT id, login, password_hash FROM users WHERE login = ?", [login]);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({ sub: user.id, login: user.login });
  return res.json({ token, user: { id: user.id, login: user.login } });
});

app.get("/api/auth/me", authRequired, async (req, res) => {
  const db = await getDb();
  const user = await db.get("SELECT id, login FROM users WHERE id = ?", [req.user.sub]);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ user });
});

app.post("/api/uploads/image", authRequired, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file is required" });
  return res.json({ url: `/uploads/${NEWS_UPLOADS_SUBDIR}/${req.file.filename}` });
});

async function ensureCurrentNews(db) {
  const draft = await db.get(
    "SELECT id, title, text FROM news WHERE published_at IS NULL ORDER BY id DESC LIMIT 1",
  );
  if (draft) return draft;
  const r = await db.run("INSERT INTO news (title, text) VALUES (?, ?)", ["", ""]);
  return { id: r.lastID, title: "", text: "" };
}

async function getLatestNews(db) {
  const latest = await db.get(
    "SELECT id, title, text, created_at, updated_at, published_at FROM news WHERE published_at IS NOT NULL ORDER BY published_at DESC, id DESC LIMIT 1",
  );
  if (!latest) return null;

  const images = await db.all(
    "SELECT id, path, sort_order FROM news_images WHERE news_id = ? ORDER BY sort_order ASC, id ASC",
    [latest.id],
  );

  return { ...latest, images };
}

app.get("/api/public/news/latest", async (_req, res) => {
  const db = await getDb();
  const latest = await getLatestNews(db);
  return res.json({ news: latest });
});

app.get("/api/news/current", authRequired, async (_req, res) => {
  const db = await getDb();
  const news = await ensureCurrentNews(db);
  const images = await db.all(
    "SELECT id, path, sort_order FROM news_images WHERE news_id = ? ORDER BY sort_order ASC, id ASC",
    [news.id],
  );
  return res.json({ news: { ...news, images } });
});

app.put("/api/news/current", authRequired, async (req, res) => {
  const { title, text } = req.body || {};
  const db = await getDb();
  const news = await ensureCurrentNews(db);

  await db.run("UPDATE news SET title = ?, text = ?, updated_at = datetime('now') WHERE id = ?", [
    String(title ?? ""),
    String(text ?? ""),
    news.id,
  ]);

  const updated = await db.get("SELECT id, title, text FROM news WHERE id = ?", [news.id]);
  const images = await db.all(
    "SELECT id, path, sort_order FROM news_images WHERE news_id = ? ORDER BY sort_order ASC, id ASC",
    [news.id],
  );

  return res.json({ news: { ...updated, images } });
});

app.post("/api/news/current/publish", authRequired, async (_req, res) => {
  const db = await getDb();
  const draft = await ensureCurrentNews(db);

  const full = await db.get("SELECT id, title, text FROM news WHERE id = ?", [draft.id]);
  const images = await db.all(
    "SELECT id, path, sort_order FROM news_images WHERE news_id = ? ORDER BY sort_order ASC, id ASC",
    [draft.id],
  );

  const title = String(full?.title ?? "").trim();
  const text = String(full?.text ?? "").trim();

  if (!title) return res.status(400).json({ error: "title is required" });
  if (!text) return res.status(400).json({ error: "text is required" });
  if (images.length === 0) return res.status(400).json({ error: "at least one image is required" });

  await db.run(
    "UPDATE news SET published_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
    [draft.id],
  );

  const r = await db.run("INSERT INTO news (title, text) VALUES (?, ?)", ["", ""]);
  const newDraft = await db.get("SELECT id, title, text FROM news WHERE id = ?", [r.lastID]);
  return res.json({ published: { ...full, images }, draft: { ...newDraft, images: [] } });
});

app.post("/api/news", authRequired, async (req, res) => {
  const { title, text } = req.body || {};
  const db = await getDb();

  const r = await db.run("INSERT INTO news (title, text) VALUES (?, ?)", [
    String(title ?? ""),
    String(text ?? ""),
  ]);

  const created = await db.get("SELECT id, title, text, created_at, updated_at FROM news WHERE id = ?", [
    r.lastID,
  ]);
  return res.json({ news: { ...created, images: [] } });
});

app.post("/api/news/current/images", authRequired, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file is required" });
  const db = await getDb();
  const news = await ensureCurrentNews(db);

  const max = await db.get("SELECT COALESCE(MAX(sort_order), -1) as maxSort FROM news_images WHERE news_id = ?", [
    news.id,
  ]);
  const nextSort = Number(max?.maxSort ?? -1) + 1;

  const url = `/uploads/${NEWS_UPLOADS_SUBDIR}/${req.file.filename}`;
  const r = await db.run("INSERT INTO news_images (news_id, path, sort_order) VALUES (?, ?, ?)", [
    news.id,
    url,
    nextSort,
  ]);

  return res.json({ image: { id: r.lastID, path: url, sort_order: nextSort } });
});

app.delete("/api/news/current/images/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  const db = await getDb();
  const news = await ensureCurrentNews(db);
  const img = await db.get("SELECT id, path FROM news_images WHERE id = ? AND news_id = ?", [id, news.id]);
  if (!img) return res.status(404).json({ error: "not found" });

  await db.run("DELETE FROM news_images WHERE id = ?", [id]);

  const prefix = `/uploads/${NEWS_UPLOADS_SUBDIR}/`;
  const filename = String(img.path).startsWith(prefix) ? String(img.path).slice(prefix.length) : null;
  if (filename) {
    const abs = path.join(NEWS_UPLOADS_DIR, path.basename(filename));
    fs.promises.unlink(abs).catch(() => {});
  }

  return res.json({ ok: true });
});

// ---------- MUSIC endpoints ----------
app.get("/api/music/current", async (_req, res) => {
  const db = await getDb();
  const tracks = await db.all("SELECT id, name, path FROM music_tracks ORDER BY created_at ASC");
  const settings = await db.get("SELECT mode, repeat_enabled FROM music_settings WHERE id = 1");
  const mode = settings?.mode || "loop";
  const repeat = Boolean(settings?.repeat_enabled ?? 1);
  return res.json({ tracks, mode, repeat });
});

app.post("/api/music/upload", authRequired, uploadMusic.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file is required" });

  const db = await getDb();
  const displayName = path.basename(req.file.originalname, path.extname(req.file.originalname))
      .replace(/[^a-zA-Zа-яА-Я0-9 ]/g, " ")
      .trim() || "Без названия";

  const url = `/uploads/music/${req.file.filename}`;
  const result = await db.run(
      "INSERT INTO music_tracks (name, path) VALUES (?, ?)",
      [displayName, url]
  );

  const track = await db.get(
      "SELECT id, name, path FROM music_tracks WHERE id = ?",
      [result.lastID]
  );

  return res.json(track);
});

app.delete("/api/music/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  const db = await getDb();
  const track = await db.get("SELECT id FROM music_tracks WHERE id = ?", [id]);
  if (!track) return res.status(404).json({ error: "not found" });

  await db.run("DELETE FROM music_tracks WHERE id = ?", [id]);
  return res.json({ ok: true });
});

app.put("/api/music/settings", authRequired, async (req, res) => {
  const { mode, repeat } = req.body || {};

  const updates = [];
  const params = [];

  if (mode !== undefined) {
    if (mode !== "loop" && mode !== "shuffle") {
      return res.status(400).json({ error: "mode must be 'loop' or 'shuffle'" });
    }
    updates.push("mode = ?");
    params.push(mode);
  }

  if (repeat !== undefined) {
    if (typeof repeat !== "boolean") {
      return res.status(400).json({ error: "repeat must be boolean" });
    }
    updates.push("repeat_enabled = ?");
    params.push(repeat ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "mode or repeat is required" });
  }

  const db = await getDb();
  await db.run(`UPDATE music_settings SET ${updates.join(", ")} WHERE id = 1`, params);

  const updated = await db.get("SELECT mode, repeat_enabled FROM music_settings WHERE id = 1");
  return res.json({ mode: updated?.mode || "loop", repeat: Boolean(updated?.repeat_enabled ?? 1) });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// HTML страницы битвы — для iframe
app.get("/battle-frame", async (_req, res) => {
  try {
    const r = await fetch(`${BATTLE_ORIGIN}/battle.html?look=dark`, {
      headers: { Cookie: `battle_guest=${BATTLE_GUEST_KEY}` },
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(await r.text());
  } catch {
    res.status(502).send("Портал недоступен");
  }
});

// Данные страницы — её скрипт зовёт fetch("/api/battle") относительно фрейма
app.get("/api/battle", async (_req, res) => {
  try {
    const r = await fetch(`${BATTLE_ORIGIN}/api/battle`, {
      headers: { Cookie: `battle_guest=${BATTLE_GUEST_KEY}`, Accept: "application/json" },
    });
    res.json(await r.json());
  } catch {
    res.status(502).json({ error: "Портал недоступен" });
  }
});