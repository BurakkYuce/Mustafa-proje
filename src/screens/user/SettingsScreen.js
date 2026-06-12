import { useState } from 'react';
import {
  View, Text, StyleSheet, Switch, ScrollView, Pressable, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useEventsStore } from '../../store/eventsStore';
import { useCategoriesStore } from '../../store/categoriesStore';
import { useTheme } from '../../utils/useTheme';
import { TextField, PrimaryButton } from '../../components/ui';
import { exportUserData, importUserData } from '../../services/backupService';
import { rescheduleUserReminders } from '../../services/notificationService';
import { updateTodayWidget } from '../../widget/updateWidget';

const VIEWS = [
  ['day', 'Gün'],
  ['week', 'Hafta'],
  ['month', 'Ay'],
];

const REMINDERS = [
  [null, 'Yok'],
  [0, 'Tam zamanında'],
  [5, '5 dk'],
  [10, '10 dk'],
  [15, '15 dk'],
  [30, '30 dk'],
  [60, '1 saat'],
  [1440, '1 gün'],
];

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const updateName = useAuthStore((s) => s.updateName);
  const changePassword = useAuthStore((s) => s.changePassword);

  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const firstDayOfWeek = useSettingsStore((s) => s.firstDayOfWeek);
  const setFirstDayOfWeek = useSettingsStore((s) => s.setFirstDayOfWeek);
  const defaultView = useSettingsStore((s) => s.defaultView);
  const setDefaultView = useSettingsStore((s) => s.setDefaultView);
  const defaultReminder = useSettingsStore((s) => s.defaultReminder);
  const setDefaultReminder = useSettingsStore((s) => s.setDefaultReminder);

  const loadEvents = useEventsStore((s) => s.load);
  const loadCategories = useCategoriesStore((s) => s.load);

  const [profileOpen, setProfileOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [pErr, setPErr] = useState('');
  const [busy, setBusy] = useState(null);

  const openProfile = () => {
    setName(user?.name || '');
    setCurPass('');
    setNewPass('');
    setPErr('');
    setProfileOpen(true);
  };

  const saveProfile = async () => {
    setPErr('');
    // Ad değiştiyse güncelle
    if (name.trim() && name.trim() !== user.name) {
      const r = await updateName(name);
      if (!r.ok) return setPErr(r.error);
    }
    // Yeni şifre girildiyse değiştir
    if (newPass) {
      const r = await changePassword(curPass, newPass);
      if (!r.ok) return setPErr(r.error);
    }
    setProfileOpen(false);
    Alert.alert('Kaydedildi', 'Profil güncellendi.');
  };

  const onExport = async () => {
    setBusy('export');
    try {
      const res = await exportUserData(user.id);
      Alert.alert('Yedek oluşturuldu', `Kategori: ${res.counts.categories}\nEtkinlik: ${res.counts.events}\n\nPaylaşım menüsünden kaydedebilirsiniz.`);
    } catch (e) {
      Alert.alert('Hata', 'Yedekleme başarısız: ' + e.message);
    } finally {
      setBusy(null);
    }
  };

  const onImport = () => {
    Alert.alert('Takvimi geri yükle', 'Seçilen yedek yüklenecek ve MEVCUT etkinlik/kategorilerin silinecek. Devam?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Devam',
        style: 'destructive',
        onPress: async () => {
          setBusy('import');
          try {
            const res = await importUserData(user.id);
            if (res.canceled) return;
            loadCategories(user.id);
            loadEvents(user.id);
            await rescheduleUserReminders(user.id);
            updateTodayWidget(); // içe aktarma eventsStore.add'den geçmiyor; widget'ı elle tazele
            Alert.alert('Geri yüklendi', `Kategori: ${res.counts.categories}\nEtkinlik: ${res.counts.events}`);
          } catch (e) {
            Alert.alert('Hata', 'Geri yükleme başarısız: ' + e.message);
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {/* Profil */}
      <Pressable onPress={openProfile} style={[styles.profile, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{(user?.name || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.email, { color: colors.subtext }]}>{user?.email}</Text>
        </View>
        <Ionicons name="create-outline" size={22} color={colors.primary} />
      </Pressable>

      {/* Takvim tercihleri */}
      <Text style={[styles.section, { color: colors.subtext }]}>TAKVİM</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>Haftanın ilk günü</Text>
        <View style={styles.segment}>
          {[[1, 'Pazartesi'], [0, 'Pazar']].map(([val, label]) => (
            <Pressable
              key={val}
              onPress={() => setFirstDayOfWeek(val)}
              style={[styles.segItem, { borderColor: colors.primary }, firstDayOfWeek === val && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.segText, { color: firstDayOfWeek === val ? '#fff' : colors.text }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>Varsayılan görünüm</Text>
        <View style={styles.segment}>
          {VIEWS.map(([val, label]) => (
            <Pressable
              key={val}
              onPress={() => setDefaultView(val)}
              style={[styles.segItem, { borderColor: colors.primary }, defaultView === val && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.segText, { color: defaultView === val ? '#fff' : colors.text }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>Varsayılan hatırlatıcı</Text>
        <View style={styles.chipWrap}>
          {REMINDERS.map(([val, label]) => (
            <Pressable
              key={String(val)}
              onPress={() => setDefaultReminder(val)}
              style={[styles.chip, { borderColor: colors.primary }, defaultReminder === val && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.chipText, { color: defaultReminder === val ? '#fff' : colors.text }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Görünüm */}
      <Text style={[styles.section, { color: colors.subtext }]}>GÖRÜNÜM</Text>
      <View style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
        <Text style={[styles.rowText, { color: colors.text }]}>Karanlık mod</Text>
        <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
      </View>

      {/* Yedekleme */}
      <Text style={[styles.section, { color: colors.subtext }]}>TAKVİMİM (YEDEK)</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 12 }]}>
        <Text style={[styles.desc, { color: colors.subtext }]}>
          Kendi etkinlik ve kategorilerini JSON dosyası olarak dışa aktar veya geri yükle. Tamamen offline.
        </Text>
        <PrimaryButton title="Dışa Aktar" icon="download-outline" onPress={onExport} loading={busy === 'export'} colors={colors} />
        <PrimaryButton title="İçe Aktar" icon="folder-open-outline" variant="ghost" onPress={onImport} loading={busy === 'import'} colors={colors} />
      </View>

      <View style={{ height: 8 }} />
      <PrimaryButton title="Çıkış Yap" icon="log-out-outline" variant="danger" onPress={logout} colors={colors} />
      <Text style={[styles.version, { color: colors.subtext }]}>Ajanda Takip v1.0 · Offline</Text>

      {/* Profil düzenleme modalı */}
      <Modal visible={profileOpen} transparent animationType="slide" onRequestClose={() => setProfileOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setProfileOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Profili Düzenle</Text>
          <TextField label="Ad Soyad" colors={colors} value={name} onChangeText={setName} />
          <Text style={[styles.hint, { color: colors.subtext }]}>Şifre değiştirmek istemiyorsan boş bırak.</Text>
          <TextField label="Mevcut şifre" colors={colors} value={curPass} onChangeText={setCurPass} secureTextEntry placeholder="••••••" />
          <TextField label="Yeni şifre" colors={colors} value={newPass} onChangeText={setNewPass} secureTextEntry placeholder="En az 4 karakter" />
          {pErr ? <Text style={{ color: colors.danger, fontWeight: '600' }}>{pErr}</Text> : null}
          <View style={{ height: 8 }} />
          <PrimaryButton title="Kaydet" icon="checkmark" onPress={saveProfile} colors={colors} />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, padding: 16 },
  avatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800' },
  email: { fontSize: 14, marginTop: 2 },
  section: { fontSize: 12, fontWeight: '700', marginTop: 8, marginLeft: 4, letterSpacing: 0.5 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  segment: { flexDirection: 'row', gap: 8 },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  segText: { fontSize: 14, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13, fontWeight: '600' },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 16 },
  rowText: { flex: 1, fontSize: 16, fontWeight: '600' },
  desc: { fontSize: 13, lineHeight: 19 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  hint: { fontSize: 12 },
});
