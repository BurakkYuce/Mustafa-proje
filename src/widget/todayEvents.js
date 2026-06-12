// Widget için "bugünün etkinlikleri"ni doğrudan SQLite'tan okur.
// Headless (arka plan) bağlamda da çalışabilsin diye DB'yi kendi açar ve
// oturum sahibini AsyncStorage'daki session.userId'den bulur.

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expandMany } from '../utils/recurrence';
import { startOfDay, endOfDay, formatTime } from '../utils/dateUtils';

export async function getTodayEventsForWidget() {
  try {
    const userId = await AsyncStorage.getItem('session.userId');
    if (!userId) return [];

    const db = SQLite.openDatabaseSync('agenda.db');
    const events = db.getAllSync('SELECT * FROM events WHERE user_id = ?', [Number(userId)]);
    const cats = db.getAllSync('SELECT id, color FROM categories WHERE user_id = ?', [Number(userId)]);
    const colorMap = {};
    cats.forEach((c) => { colorMap[c.id] = c.color; });

    const today = new Date();
    const occ = expandMany(events, startOfDay(today), endOfDay(today));
    return occ.map((o) => ({
      title: o.event.title,
      timeLabel: formatTime(o.start),
      color: colorMap[o.event.category_id] || '#9ca3af',
    }));
  } catch (e) {
    return [];
  }
}
