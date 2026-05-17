import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = process.env.DATABASE_FILE || path.join(__dirname, '../calendar.db');
export const db = new sqlite3.Database(dbFile);

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function callback(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      start TEXT,
      end TEXT,
      note TEXT,
      color TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await run(`ALTER TABLE events ADD COLUMN color TEXT DEFAULT ''`).catch(() => {});
  await run(`ALTER TABLE events ADD COLUMN user_id TEXT`).catch(() => {});

  await run(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      date TEXT NOT NULL,
      text TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await run(`ALTER TABLE todos ADD COLUMN user_id TEXT`).catch(() => {});

  // Rebuild text_entries with (user_id, type, entry_key) as PK if needed
  const cols = await all(`PRAGMA table_info(text_entries)`);
  const hasUserId = cols.some((c) => c.name === 'user_id');

  if (!hasUserId) {
    await run(`
      CREATE TABLE IF NOT EXISTS text_entries_new (
        user_id TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL,
        entry_key TEXT NOT NULL,
        value TEXT DEFAULT '',
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(user_id, type, entry_key)
      )
    `);
    // Copy existing orphan rows with empty user_id (will be claimed via /api/claim-data)
    await run(`
      INSERT OR IGNORE INTO text_entries_new (user_id, type, entry_key, value, updated_at)
      SELECT '', type, entry_key, value, updated_at FROM text_entries
    `).catch(() => {});
    await run(`DROP TABLE text_entries`);
    await run(`ALTER TABLE text_entries_new RENAME TO text_entries`);
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS text_entries (
        user_id TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL,
        entry_key TEXT NOT NULL,
        value TEXT DEFAULT '',
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(user_id, type, entry_key)
      )
    `);
  }
}
