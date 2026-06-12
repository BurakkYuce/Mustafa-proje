// Uygulama kökü: DB başlat -> ayarları/oturumu geri yükle -> bildirim izni iste.
// Tema (açık/koyu) NavigationContainer'a verilir; settingsStore.isDark değişince yeniden render olur.
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from './src/db';
import { setupNotifications } from './src/services/notificationService';
import { useAuthStore } from './src/store/authStore';
import { useSettingsStore } from './src/store/settingsStore';
import { getNavTheme, getColors } from './src/utils/theme';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const [ready, setReady] = useState(false);
  const isDark = useSettingsStore((s) => s.isDark);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();      // şema + admin seed
        await loadSettings();      // dark mode tercihi
        await restoreSession();    // kayıtlı oturum
        setupNotifications();      // bildirim kanalı + izin (arka planda)
      } catch (e) {
        console.error('Başlatma hatası:', e);
      } finally {
        setReady(true);
      }
    })();
  }, [loadSettings, restoreSession]);

  if (!ready) {
    const c = getColors(isDark);
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={getNavTheme(isDark)}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
