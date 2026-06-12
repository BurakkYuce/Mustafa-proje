// Alarm listesi: ekle / aç-kapat / sil. Saat seçimi için DateTimePicker (time modu).
// Alarmlar alarmsStore üzerinden AsyncStorage'da kalıcı; bildirimler offline planlanır.
import { useEffect, useState } from 'react';
import {
  View, Text, Pressable, Switch, ScrollView, Modal, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAlarmsStore } from '../../store/alarmsStore';
import { TextField, PrimaryButton } from '../ui';
import Empty from '../Empty';

const pad = (n) => String(n).padStart(2, '0');

export default function AlarmList({ colors }) {
  const alarms = useAlarmsStore((s) => s.alarms);
  const load = useAlarmsStore((s) => s.load);
  const add = useAlarmsStore((s) => s.add);
  const toggle = useAlarmsStore((s) => s.toggle);
  const remove = useAlarmsStore((s) => s.remove);

  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(() => new Date());
  const [label, setLabel] = useState('');
  const [daily, setDaily] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setTime(new Date());
    setLabel('');
    setDaily(false);
    setShowPicker(false);
    setOpen(true);
  };

  const save = async () => {
    await add({
      hour: time.getHours(),
      minute: time.getMinutes(),
      label,
      repeat: daily ? 'daily' : 'once',
    });
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 90 }}>
        {alarms.length === 0 ? (
          <Empty text="Henüz alarm yok" icon="alarm-outline" colors={colors} />
        ) : (
          alarms.map((a) => (
            <View key={a.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.time, { color: a.enabled ? colors.text : colors.subtext }]}>
                  {pad(a.hour)}:{pad(a.minute)}
                </Text>
                <Text style={[styles.meta, { color: colors.subtext }]}>
                  {a.repeat === 'daily' ? 'Her gün' : 'Bir kez'}
                  {a.label ? ` · ${a.label}` : ''}
                </Text>
              </View>
              <Switch
                value={a.enabled}
                onValueChange={() => toggle(a.id)}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
              <Pressable onPress={() => remove(a.id)} hitSlop={10} style={{ marginLeft: 12 }}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Ekle FAB */}
      <Pressable onPress={openAdd} style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      {/* Ekle modalı */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Yeni alarm</Text>

          <Pressable
            onPress={() => setShowPicker(true)}
            style={[styles.timeBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="time-outline" size={22} color={colors.primary} />
            <Text style={[styles.timeBtnText, { color: colors.text }]}>
              {pad(time.getHours())}:{pad(time.getMinutes())}
            </Text>
          </Pressable>

          {showPicker && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour
              onChange={(e, d) => {
                setShowPicker(false);
                if (d) setTime(d);
              }}
            />
          )}

          <TextField label="Etiket (opsiyonel)" colors={colors} value={label} onChangeText={setLabel} placeholder="Örn. Sabah" />

          <View style={[styles.dailyRow, { borderColor: colors.border }]}>
            <Text style={[styles.dailyText, { color: colors.text }]}>Her gün tekrarla</Text>
            <Switch
              value={daily}
              onValueChange={setDaily}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>

          <PrimaryButton title="Kaydet" icon="checkmark" onPress={save} colors={colors} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10,
  },
  time: { fontSize: 30, fontWeight: '300', fontVariant: ['tabular-nums'] },
  meta: { fontSize: 13, marginTop: 2 },
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  timeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
  },
  timeBtnText: { fontSize: 26, fontWeight: '300', fontVariant: ['tabular-nums'] },
  dailyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 12, padding: 14,
  },
  dailyText: { fontSize: 15, fontWeight: '600' },
});
