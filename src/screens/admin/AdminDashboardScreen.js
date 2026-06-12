import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { countUsers } from '../../db/usersRepo';
import { countEvents, categoryDistribution } from '../../db/eventsRepo';
import { useSettingsStore } from '../../store/settingsStore';
import { useTheme } from '../../utils/useTheme';
import StatCard from '../../components/StatCard';
import BarChart from '../../components/BarChart';
import Empty from '../../components/Empty';

export default function AdminDashboardScreen() {
  const { colors, isDark } = useTheme();
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);

  const [stats, setStats] = useState({ users: 0, events: 0, dist: [] });

  useFocusEffect(
    useCallback(() => {
      setStats({
        users: countUsers(),
        events: countEvents(),
        dist: categoryDistribution(),
      });
    }, [])
  );

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.heading, { color: colors.text }]}>Genel Bakış</Text>

      <View style={styles.statRow}>
        <StatCard label="Toplam Kullanıcı" value={stats.users} icon="people" accent="#3b82f6" colors={colors} />
        <StatCard label="Toplam Etkinlik" value={stats.events} icon="calendar" accent="#16a34a" colors={colors} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Kategori Bazında Etkinlik Dağılımı</Text>
        {stats.dist.length === 0 ? (
          <Empty text="Henüz etkinlik yok" icon="bar-chart-outline" colors={colors} />
        ) : (
          <BarChart data={stats.dist} colors={colors} />
        )}
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  heading: { fontSize: 22, fontWeight: '800' },
  statRow: { flexDirection: 'row', gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 16 },
  rowText: { flex: 1, fontSize: 16, fontWeight: '600' },
});
