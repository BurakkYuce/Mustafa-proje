// SQLite başlatma, migration (şema) ve varsayılan admin seed.
// Açık kaynak veritabanı: expo-sqlite (SQLite). Tamamen offline.

import * as SQLite from 'expo-sqlite';
import { hashPassword } from '../utils/hash';

const DB_NAME = 'agenda.db';

let _db = null;

export function getDb() {
  if (!_db) {
    _db = SQLite.openDatabaseSync(DB_NAME);
  }
  return _db;
}

// Şema (proje şartnamesindeki ile birebir)
const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('user','admin')) DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT,
  recurrence_rule TEXT CHECK(recurrence_rule IN ('none','daily','weekly','monthly')) DEFAULT 'none',
  recurrence_end_date TEXT,
  reminder_offset_minutes INTEGER,
  notification_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
`;

// Uygulama açılışında bir kez çağrılır (App.js).
export async function initDatabase() {
  const db = getDb();
  db.execSync(SCHEMA_SQL);
  await seedAdmin();
}

// Varsayılan admin hesabını oluştur (yoksa).
// Demo girişi: admin@admin.com / admin123
async function seedAdmin() {
  const db = getDb();
  const existing = db.getFirstSync(
    'SELECT id FROM users WHERE email = ?',
    ['admin@admin.com']
  );
  if (!existing) {
    const hashed = await hashPassword('admin123');
    db.runSync(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Yönetici', 'admin@admin.com', hashed, 'admin']
    );
  }
}
