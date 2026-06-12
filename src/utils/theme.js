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

export function getColors(isDark) {
  return isDark ? darkColors : lightColors;
}

// React Navigation container teması
export function getNavTheme(isDark) {
  const c = getColors(isDark);
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
