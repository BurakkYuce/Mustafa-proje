// Alarm store'u. Alarmlar AsyncStorage'da kalıcı, tamamen offline.
// Her alarm bir yerel bildirime karşılık gelir (notifId). 'daily' -> native günlük
// tekrar; 'once' -> bir sonraki saat:dakika için tek seferlik.
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleAlarm, cancelNotif } from '../services/notificationService';

const KEY = 'alarms.list';

const byTime = (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute);

function persist(alarms) {
  AsyncStorage.setItem(KEY, JSON.stringify(alarms)).catch(() => {});
}

export const useAlarmsStore = create((set, get) => ({
  alarms: [],
  loaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      set({ alarms: raw ? JSON.parse(raw) : [], loaded: true });
    } catch (e) {
      set({ alarms: [], loaded: true });
    }
  },

  add: async ({ hour, minute, label, repeat }) => {
    const alarm = {
      id: String(Date.now()),
      hour,
      minute,
      label: label || '',
      repeat: repeat === 'daily' ? 'daily' : 'once',
      enabled: true,
      notifId: null,
    };
    alarm.notifId = await scheduleAlarm(alarm);
    const alarms = [...get().alarms, alarm].sort(byTime);
    set({ alarms });
    persist(alarms);
  },

  // Aç/kapat: kapatınca bildirimi iptal et, açınca yeniden planla.
  toggle: async (id) => {
    const alarms = await Promise.all(
      get().alarms.map(async (a) => {
        if (a.id !== id) return a;
        if (a.enabled) {
          await cancelNotif(a.notifId);
          return { ...a, enabled: false, notifId: null };
        }
        const notifId = await scheduleAlarm(a);
        return { ...a, enabled: true, notifId };
      })
    );
    set({ alarms });
    persist(alarms);
  },

  remove: async (id) => {
    const target = get().alarms.find((a) => a.id === id);
    if (target) await cancelNotif(target.notifId);
    const alarms = get().alarms.filter((a) => a.id !== id);
    set({ alarms });
    persist(alarms);
  },
}));
