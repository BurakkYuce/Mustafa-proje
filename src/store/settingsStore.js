// Uygulama ayarları. Hepsi AsyncStorage ile kalıcı, tamamen offline.
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  dark: 'settings.isDark',
  fdow: 'settings.firstDayOfWeek',
  view: 'settings.defaultView',
  reminder: 'settings.defaultReminder',
};

export const useSettingsStore = create((set, get) => ({
  isDark: false,
  firstDayOfWeek: 1, // 1 = Pazartesi, 0 = Pazar
  defaultView: 'day', // 'day' | 'week' | 'month'
  defaultReminder: null, // dakika ya da null
  loaded: false,

  loadSettings: async () => {
    try {
      const entries = await AsyncStorage.multiGet([K.dark, K.fdow, K.view, K.reminder]);
      const m = Object.fromEntries(entries);
      set({
        isDark: m[K.dark] === '1',
        firstDayOfWeek: m[K.fdow] != null ? Number(m[K.fdow]) : 1,
        defaultView: m[K.view] || 'day',
        defaultReminder:
          m[K.reminder] != null && m[K.reminder] !== '' ? Number(m[K.reminder]) : null,
        loaded: true,
      });
    } catch (e) {
      set({ loaded: true });
    }
  },

  toggleTheme: () => {
    const next = !get().isDark;
    AsyncStorage.setItem(K.dark, next ? '1' : '0').catch(() => {});
    set({ isDark: next });
  },

  setFirstDayOfWeek: (n) => {
    AsyncStorage.setItem(K.fdow, String(n)).catch(() => {});
    set({ firstDayOfWeek: n });
  },

  setDefaultView: (v) => {
    AsyncStorage.setItem(K.view, v).catch(() => {});
    set({ defaultView: v });
  },

  setDefaultReminder: (mins) => {
    AsyncStorage.setItem(K.reminder, mins == null ? '' : String(mins)).catch(() => {});
    set({ defaultReminder: mins });
  },
}));
