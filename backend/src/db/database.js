import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DB_PATH || join(__dirname, '../../data');
const DB_FILE = join(DATA_DIR, 'family-finance.db');

mkdirSync(DATA_DIR, { recursive: true });

const SQL = await initSqlJs();

let db;
if (existsSync(DB_FILE)) {
  db = new SQL.Database(readFileSync(DB_FILE));
} else {
  db = new SQL.Database();
}

function save() {
  writeFileSync(DB_FILE, Buffer.from(db.export()));
}

db.run(`PRAGMA foreign_keys = ON;`);
db.run(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('income','expense','both')),
    color TEXT NOT NULL DEFAULT '#6366f1', icon TEXT NOT NULL DEFAULT '💰',
    sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS subcategories (
    id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(category_id, name)
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY, date TEXT NOT NULL, amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    category_id TEXT NOT NULL REFERENCES categories(id),
    subcategory_id TEXT REFERENCES subcategories(id),
    description TEXT NOT NULL, notes TEXT, payment_method TEXT DEFAULT 'bank',
    is_recurring INTEGER DEFAULT 0, recurring_frequency TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount REAL NOT NULL, year INTEGER NOT NULL, month INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')), UNIQUE(category_id, year, month)
  );
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);
save();

export function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export function get(sql, params = []) {
  return all(sql, params)[0] || null;
}

// Single write - saves immediately
export function run(sql, params = []) {
  db.run(sql, params);
  save();
}

// Batch writes in a transaction - single save at the end
export function transaction(fn) {
  db.run('BEGIN');
  try {
    fn({ exec: (sql, params=[]) => db.run(sql, params) });
    db.run('COMMIT');
    save();
  } catch (e) {
    try { db.run('ROLLBACK'); } catch {}
    throw e;
  }
}

export default { all, get, run, transaction };
