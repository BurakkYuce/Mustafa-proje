import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTheme } from '../../utils/useTheme';
import { PrimaryButton } from '../../components/ui';

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {/* Profil kartı */}
      <View style={[styles.profile, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{(user?.name || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.email, { color: colors.subtext }]}>{user?.email}</Text>
        </View>
      </View>

      {/* Karanlık mod */}
      <View style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
        <Text style={[styles.rowText, { color: colors.text }]}>Karanlık mod</Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#fff"
        />
      </View>

      <View style={{ flex: 1 }} />

      <PrimaryButton title="Çıkış Yap" icon="log-out-outline" variant="danger" onPress={logout} colors={colors} />
      <Text style={[styles.version, { color: colors.subtext }]}>Ajanda Takip v1.0 · Offline</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, gap: 14 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, padding: 16 },
  avatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800' },
  email: { fontSize: 14, marginTop: 2 },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 16 },
  rowText: { flex: 1, fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 8 },
});
