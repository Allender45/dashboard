const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "..", "data", "app.db");

let dbPromise;

async function initDb(db) {
  await db.exec("PRAGMA foreign_keys = ON;");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      text TEXT NOT NULL DEFAULT '',
      published_at TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  try {
    await db.exec("ALTER TABLE news ADD COLUMN published_at TEXT NULL;");
  } catch {
    // ignore
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS news_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      news_id INTEGER NOT NULL,
      path TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
    );
  `);

  // music tracks
  await db.exec(`
      CREATE TABLE IF NOT EXISTS music_tracks
      (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT NOT NULL,
          path       TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
  `);

// music settings (одна запись с id=1)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS music_settings (
                                                id INTEGER PRIMARY KEY CHECK (id = 1),
                                                mode TEXT NOT NULL DEFAULT 'loop'
    );
  `);

// Вставить настройку по умолчанию, если её нет
  const settingsExists = await db.get("SELECT id FROM music_settings WHERE id = 1");
  if (!settingsExists) {
    await db.run("INSERT INTO music_settings (id, mode) VALUES (1, 'loop')");
  }
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = open({ filename: DB_PATH, driver: sqlite3.Database }).then(async (db) => {
      await initDb(db);
      return db;
    });
  }
  return dbPromise;
}

module.exports = { getDb, DB_PATH };
