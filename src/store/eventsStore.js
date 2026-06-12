// Etkinlik store'u. CRUD + hatırlatıcı planlama/iptal entegrasyonu.
import { create } from 'zustand';
import * as repo from '../db/eventsRepo';
import { scheduleReminder, cancelReminder } from '../services/notificationService';

export const useEventsStore = create((set, get) => ({
  events: [],

  load: (userId) => set({ events: repo.listByUser(userId) }),

  // Yeni etkinlik: oluştur -> hatırlatıcı planla -> notification_id'yi kaydet.
  add: async (userId, data) => {
    const id = repo.createEvent({ ...data, user_id: userId });
    const created = repo.getById(id);
    const notifId = await scheduleReminder(created);
    if (notifId) repo.setNotificationId(id, notifId);
    get().load(userId);
    return id;
  },

  // Güncelle: eski hatırlatıcıyı iptal et -> güncelle -> yeniden planla.
  update: async (userId, id, data, oldNotificationId) => {
    await cancelReminder(oldNotificationId);
    repo.updateEvent(id, { ...data, notification_id: null });
    const updated = repo.getById(id);
    const notifId = await scheduleReminder(updated);
    if (notifId) repo.setNotificationId(id, notifId);
    get().load(userId);
  },

  // Sil: hatırlatıcıyı iptal et -> satırı sil.
  remove: async (userId, event) => {
    await cancelReminder(event.notification_id);
    repo.deleteEvent(event.id);
    get().load(userId);
  },
}));
