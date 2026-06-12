// Tema paletleri (açık/koyu) + React Navigation tema nesneleri.
// isDark durumu settingsStore'da tutulur ve AsyncStorage'da kalıcıdır.

import {
  DefaultTheme as NavDefault,
  DarkTheme as NavDark,
} from '@react-navigation/native';

export const lightColors = {
  background: '#f3f4f6',
  card: '#ffffff',
  text: '#111827',
  subtext: '#6b7280',
  primary: '#2563eb',
  primaryText: '#ffffff',
  border: '#e5e7eb',
  danger: '#ef4444',
  success: '#16a34a',
  inputBg: '#ffffff',
  timelineLine: '#e5e7eb',
};

export const darkColors = {
  background: '#0f1115',
  card: '#1a1d24',
  text: '#f3f4f6',
  subtext: '#9ca3af',
  primary: '#3b82f6',
  primaryText: '#ffffff',
  border: '#2a2e37',
  danger: '#f87171',
  success: '#22c55e',
  inputBg: '#1f232b',
  timelineLine: '#2a2e37',
};

// Renk temaları: her biri açık/koyu mod için bir accent (primary) tonu verir.
// primary tüm vurguları (buton, FAB, aktif sekme, başlık) sürdüğü için tema
// belirgin biçimde değişir; arka plan/kart nötr kalır (okunabilirlik için).
export const THEME_DEFS = {
  default: { name: 'Mavi', light: '#2563eb', dark: '#3b82f6' },
  ocean: { name: 'Okyanus', light: '#0891b2', dark: '#22d3ee' },
  forest: { name: 'Orman', light: '#16a34a', dark: '#34d399' },
  sunset: { name: 'Gün Batımı', light: '#ea580c', dark: '#fb923c' },
  grape: { name: 'Üzüm', light: '#7c3aed', dark: '#a78bfa' },
};

// Settings UI için: [{ key, name, color }]
export const THEME_LIST = Object.entries(THEME_DEFS).map(([key, v]) => ({
  key,
  name: v.name,
  color: v.light,
}));

export function getColors(isDark, theme = 'default') {
  const base = isDark ? darkColors : lightColors;
  const def = THEME_DEFS[theme] || THEME_DEFS.default;
  return { ...base, primary: isDark ? def.dark : def.light };
}

// React Navigation container teması
export function getNavTheme(isDark, theme = 'default') {
  const c = getColors(isDark, theme);
  const base = isDark ? NavDark : NavDefault;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.background,
      card: c.card,
      text: c.text,
      border: c.border,
      notification: c.primary,
    },
  };
}

// Önceden tanımlı kategori renkleri (ColorPicker için)
export const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];
