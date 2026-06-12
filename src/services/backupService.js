// JSON yedekleme/geri yükleme servisi. Tamamen offline (cihaz dosya sistemi).
// Export: expo-file-system (yeni File/Paths API) + expo-sharing ile paylaş/kaydet.
// Import: expo-document-picker ile dosya seç + expo-file-system/legacy ile oku
//         (seçilen content:// URI'lerini güvenilir okumak için legacy kullanılır).

import { File, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb } from '../db';

export function buildBackupObject() {
  const db = getDb();
  return {
    app: 'ajanda-takip',
    version: 1,
    exported_at: new Date().toISOString(),
    users: db.getAllSync('SELECT * FROM users'),
    categories: db.getAllSync('SELECT * FROM categories'),
    events: db.getAllSync('SELECT * FROM events'),
  };
}

// Tüm tabloları JSON'a aktar, dosyaya yaz ve paylaşım menüsünü aç.
export async function exportAllToJson() {
  const data = buildBackupObject();
  const json = JSON.stringify(data, null, 2);
  const filename = `ajanda-yedek-${Date.now()}.json`;

  const file = new File(Paths.document, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Yedeği paylaş / kaydet',
      UTI: 'public.json',
    });
  }
  return {
    uri: file.uri,
    counts: {
      users: data.users.length,
      categories: data.categories.length,
      events: data.events.length,
    },
  };
}

// JSON dosyası seç ve veritabanını geri yükle.
export async function importJsonFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return { canceled: true };

  const uri = result.assets[0].uri;
  const content = await FileSystemLegacy.readAsStringAsync(uri);
  const data = JSON.parse(content);

  if (!data || !Array.isArray(data.users)) {
    throw new Error('Geçersiz yedek dosyası');
  }

  restoreFromObject(data);
  return {
    canceled: false,
    counts: {
      users: (data.users || []).length,
      categories: (data.categories || []).length,
      events: (data.events || []).length,
    },
  };
}

// Tabloları temizleyip yedekteki satırları (id'leri koruyarak) yeniden yükle.
function restoreFromObject(data) {
  const db = getDb();
  db.execSync('PRAGMA foreign_keys = OFF;');
  try {
    db.execSync('BEGIN TRANSACTION;');
    db.runSync('DELETE FROM events');
    db.runSync('DELETE FROM categories');
    db.runSync('DELETE FROM users');

    for (const u of data.users || []) {
      db.runSync(
        'INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [u.id, u.name, u.email, u.password, u.role || 'user', u.created_at ?? null]
      );
    }
    for (const c of data.categories || []) {
      db.runSync(
        'INSERT INTO categories (id, user_id, name, color) VALUES (?, ?, ?, ?)',
        [c.id, c.user_id, c.name, c.color]
      );
    }
    for (const e of data.events || []) {
      db.runSync(
        `INSERT INTO events
          (id, user_id, category_id, title, description, start_time, end_time,
           recurrence_rule, recurrence_end_date, reminder_offset_minutes, notification_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          e.id, e.user_id, e.category_id ?? null, e.title, e.description ?? null,
          e.start_time, e.end_time ?? null, e.recurrence_rule || 'none',
          e.recurrence_end_date ?? null, e.reminder_offset_minutes ?? null,
          e.notification_id ?? null, e.created_at ?? null,
        ]
      );
    }
    db.execSync('COMMIT;');
  } catch (err) {
    db.execSync('ROLLBACK;');
    throw err;
  } finally {
    db.execSync('PRAGMA foreign_keys = ON;');
  }
}
