// users tablosu sorguları.
import { getDb } from './index';

export function createUser({ name, email, password, role = 'user' }) {
  const res = getDb().runSync(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, password, role]
  );
  return res.lastInsertRowId;
}

export function findByEmail(email) {
  return (
    getDb().getFirstSync('SELECT * FROM users WHERE email = ?', [email]) || null
  );
}

export function getUserById(id) {
  return (
    getDb().getFirstSync('SELECT * FROM users WHERE id = ?', [id]) || null
  );
}

// Admin paneli — şifre alanı hariç tüm kullanıcılar.
export function getAllUsers() {
  return getDb().getAllSync(
    'SELECT id, name, email, role, created_at FROM users ORDER BY id ASC'
  );
}

export function countUsers() {
  const row = getDb().getFirstSync('SELECT COUNT(*) AS c FROM users');
  return row ? row.c : 0;
}

export function updateName(id, name) {
  getDb().runSync('UPDATE users SET name = ? WHERE id = ?', [name, id]);
}

export function updatePassword(id, hashedPassword) {
  getDb().runSync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
}
