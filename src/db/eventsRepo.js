// events tablosu sorguları.
import { getDb } from './index';

export function listByUser(userId) {
  return getDb().getAllSync(
    'SELECT * FROM events WHERE user_id = ? ORDER BY start_time ASC',
    [userId]
  );
}

export function getById(id) {
  return getDb().getFirstSync('SELECT * FROM events WHERE id = ?', [id]) || null;
}

export function createEvent(e) {
  const res = getDb().runSync(
    `INSERT INTO events
      (user_id, category_id, title, description, start_time, end_time,
       recurrence_rule, recurrence_end_date, reminder_offset_minutes, notification_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      e.user_id,
      e.category_id ?? null,
      e.title,
      e.description ?? null,
      e.start_time,
      e.end_time ?? null,
      e.recurrence_rule ?? 'none',
      e.recurrence_end_date ?? null,
      e.reminder_offset_minutes ?? null,
      e.notification_id ?? null,
    ]
  );
  return res.lastInsertRowId;
}

export function updateEvent(id, e) {
  getDb().runSync(
    `UPDATE events SET
       category_id = ?, title = ?, description = ?, start_time = ?, end_time = ?,
       recurrence_rule = ?, recurrence_end_date = ?, reminder_offset_minutes = ?,
       notification_id = ?
     WHERE id = ?`,
    [
      e.category_id ?? null,
      e.title,
      e.description ?? null,
      e.start_time,
      e.end_time ?? null,
      e.recurrence_rule ?? 'none',
      e.recurrence_end_date ?? null,
      e.reminder_offset_minutes ?? null,
      e.notification_id ?? null,
      id,
    ]
  );
}

export function setNotificationId(id, notificationId) {
  getDb().runSync('UPDATE events SET notification_id = ? WHERE id = ?', [
    notificationId,
    id,
  ]);
}

export function deleteEvent(id) {
  getDb().runSync('DELETE FROM events WHERE id = ?', [id]);
}

// ---- Admin istatistikleri (tüm kullanıcılar genelinde) ----

export function countEvents() {
  const row = getDb().getFirstSync('SELECT COUNT(*) AS c FROM events');
  return row ? row.c : 0;
}

// Kategori bazında etkinlik dağılımı (kategori adına göre grupla).
export function categoryDistribution() {
  return getDb().getAllSync(
    `SELECT
       COALESCE(c.name, 'Kategorisiz') AS name,
       COALESCE(c.color, '#9ca3af') AS color,
       COUNT(e.id) AS count
     FROM events e
     LEFT JOIN categories c ON e.category_id = c.id
     GROUP BY name, color
     ORDER BY count DESC`
  );
}
