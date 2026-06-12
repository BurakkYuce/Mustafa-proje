// categories tablosu sorguları.
import { getDb } from './index';

export function listByUser(userId) {
  return getDb().getAllSync(
    'SELECT * FROM categories WHERE user_id = ? ORDER BY name COLLATE NOCASE ASC',
    [userId]
  );
}

export function createCategory({ user_id, name, color }) {
  const res = getDb().runSync(
    'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)',
    [user_id, name, color]
  );
  return res.lastInsertRowId;
}

export function updateCategory(id, { name, color }) {
  getDb().runSync('UPDATE categories SET name = ?, color = ? WHERE id = ?', [
    name,
    color,
    id,
  ]);
}

export function deleteCategory(id) {
  const db = getDb();
  // Bu kategoriyi kullanan etkinliklerin category_id'sini NULL yap (FK kısıtı için).
  db.runSync('UPDATE events SET category_id = NULL WHERE category_id = ?', [id]);
  db.runSync('DELETE FROM categories WHERE id = ?', [id]);
}
