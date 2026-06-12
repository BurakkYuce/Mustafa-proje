// Aktif tema renklerini veren hook (settingsStore.isDark + colorTheme'e bağlı).
import { useSettingsStore } from '../store/settingsStore';
import { getColors } from './theme';

export function useTheme() {
  const isDark = useSettingsStore((s) => s.isDark);
  const colorTheme = useSettingsStore((s) => s.colorTheme);
  return { isDark, colorTheme, colors: getColors(isDark, colorTheme) };
}
