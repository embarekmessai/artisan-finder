const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");

const databasePath = path.resolve(
  process.env.DATABASE_PATH || "./data/artisans.sqlite"
);

fs.mkdirSync(path.dirname(databasePath), {
  recursive: true,
});

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS artisans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_place_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    city TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    website TEXT,
    email TEXT,
    email_source TEXT,
    collected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_artisans_city
    ON artisans(city);

  CREATE INDEX IF NOT EXISTS idx_artisans_category
    ON artisans(category);

  CREATE INDEX IF NOT EXISTS idx_artisans_email
    ON artisans(email);
`);

module.exports = db;
