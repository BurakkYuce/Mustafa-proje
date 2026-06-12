// Uygulama kökü: DB başlat -> ayarları/oturumu geri yükle -> bildirim izni iste.
// Tema (açık/koyu) NavigationContainer'a verilir; settingsStore.isDark değişince yeniden render olur.
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from './src/db';
import { setupNotifications, rescheduleUserReminders } from './src/services/notificationService';
import { useAuthStore } from './src/store/authStore';
import { useSettingsStore } from './src/store/settingsStore';
import { getNavTheme, getColors } from './src/utils/theme';
import { updateTodayWidget } from './src/widget/updateWidget';
import ErrorBoundary from './src/components/ErrorBoundary';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const [ready, setReady] = useState(false);
  const isDark = useSettingsStore((s) => s.isDark);
  const colorTheme = useSettingsStore((s) => s.colorTheme);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();      // şema + admin seed
        await loadSettings();      // dark mode tercihi
        await restoreSession();    // kayıtlı oturum
        await setupNotifications(); // bildirim kanalı + izin
        const user = useAuthStore.getState().currentUser;
        if (user) await rescheduleUserReminders(user.id); // tekrarlayanları tazele
        await updateTodayWidget(); // açılışta widget'ı bugüne çek (Android; iOS no-op)
      } catch (e) {
        console.error('Başlatma hatası:', e);
      } finally {
        setReady(true);
      }
    })();
  }, [loadSettings, restoreSession]);

  if (!ready) {
    const c = getColors(isDark, colorTheme);
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer theme={getNavTheme(isDark, colorTheme)}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
