// Etkinlik store'u. CRUD + hatırlatıcı planlama/iptal + widget tazeleme entegrasyonu.
import { create } from 'zustand';
import * as repo from '../db/eventsRepo';
import { scheduleEventReminders, cancelEventReminders } from '../services/notificationService';
import { updateTodayWidget } from '../widget/updateWidget';

// Planlanan bildirim id'lerini events.notification_id'ye JSON dizi olarak yaz (yoksa null).
function storeIds(id, ids) {
  repo.setNotificationId(id, ids.length ? JSON.stringify(ids) : null);
}

export const useEventsStore = create((set, get) => ({
  events: [],

  load: (userId) => set({ events: repo.listByUser(userId) }),

  // Yeni etkinlik: oluştur -> hatırlatıcı(lar)ı planla -> id'leri kaydet -> widget'ı tazele.
  add: async (userId, data) => {
    const id = repo.createEvent({ ...data, user_id: userId });
    const created = repo.getById(id);
    const ids = await scheduleEventReminders(created);
    storeIds(id, ids);
    get().load(userId);
    updateTodayWidget();
    return id;
  },

  // Güncelle: eski hatırlatıcıları iptal et -> güncelle -> yeniden planla -> widget'ı tazele.
  update: async (userId, id, data, oldNotificationId) => {
    await cancelEventReminders(oldNotificationId);
    repo.updateEvent(id, { ...data, notification_id: null });
    const updated = repo.getById(id);
    const ids = await scheduleEventReminders(updated);
    storeIds(id, ids);
    get().load(userId);
    updateTodayWidget();
  },

  // Sil: hatırlatıcıları iptal et -> satırı sil -> widget'ı tazele.
  remove: async (userId, event) => {
    await cancelEventReminders(event.notification_id);
    repo.deleteEvent(event.id);
    get().load(userId);
    updateTodayWidget();
  },
}));
