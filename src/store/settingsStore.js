// Uygulama ayarları (dark mode). AsyncStorage ile kalıcı.
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'settings.isDark';

export const useSettingsStore = create((set, get) => ({
  isDark: false,
  loaded: false,

  loadSettings: async () => {
    try {
      const v = await AsyncStorage.getItem(KEY);
      set({ isDark: v === '1', loaded: true });
    } catch (e) {
      set({ loaded: true });
    }
  },

  toggleTheme: () => {
    const next = !get().isDark;
    AsyncStorage.setItem(KEY, next ? '1' : '0').catch(() => {});
    set({ isDark: next });
  },
}));
