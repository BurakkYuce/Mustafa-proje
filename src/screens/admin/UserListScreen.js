import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getAllUsers } from '../../db/usersRepo';
import { useTheme } from '../../utils/useTheme';
import Empty from '../../components/Empty';

export default function UserListScreen() {
  const { colors } = useTheme();
  const [users, setUsers] = useState([]);

  useFocusEffect(
    useCallback(() => {
      setUsers(getAllUsers());
    }, [])
  );

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 14 }}>
      {users.length === 0 ? (
        <Empty text="Kullanıcı yok" icon="people-outline" colors={colors} />
      ) : (
        users.map((u) => {
          const isAdmin = u.role === 'admin';
          return (
            <View key={u.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: isAdmin ? colors.danger : colors.primary }]}>
                <Text style={styles.avatarText}>{(u.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]}>{u.name}</Text>
                <Text style={[styles.email, { color: colors.subtext }]}>{u.email}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: (isAdmin ? colors.danger : colors.primary) + '22' }]}>
                <Text style={[styles.badgeText, { color: isAdmin ? colors.danger : colors.primary }]}>
                  {isAdmin ? 'Admin' : 'Kullanıcı'}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700' },
  email: { fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
