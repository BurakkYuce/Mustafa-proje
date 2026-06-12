// Aktif tema renklerini veren hook (settingsStore.isDark'a bağlı).
import { useSettingsStore } from '../store/settingsStore';
import { getColors } from './theme';

export function useTheme() {
  const isDark = useSettingsStore((s) => s.isDark);
  return { isDark, colors: getColors(isDark) };
}
