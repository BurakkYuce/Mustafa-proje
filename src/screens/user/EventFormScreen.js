import { useEffect, useLayoutEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuthStore } from '../../store/authStore';
import { useEventsStore } from '../../store/eventsStore';
import { useCategoriesStore } from '../../store/categoriesStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getById } from '../../db/eventsRepo';
import { useTheme } from '../../utils/useTheme';
import { TextField, PrimaryButton } from '../../components/ui';
import { shareEventAsIcs } from '../../services/icsService';
import { parseLocal, formatLocal, formatDate, formatTime } from '../../utils/dateUtils';

const RULES = [
  ['none', 'Yok'],
  ['daily', 'Günlük'],
  ['weekly', 'Haftalık'],
  ['monthly', 'Aylık'],
];

const REMINDERS = [
  [null, 'Yok'],
  [0, 'Tam zamanında'],
  [5, '5 dk önce'],
  [10, '10 dk önce'],
  [15, '15 dk önce'],
  [30, '30 dk önce'],
  [60, '1 saat önce'],
  [1440, '1 gün önce'],
];

// Elle saat girişi: "HH:MM", "HHMM" veya "HMM" kabul eder; geçersizse null döner.
// Geçerliyse verilen tarihin saat/dakikasını günceller (yeni Date döndürür).
function parseTimeOnto(base, str) {
  const s = String(str).trim();
  let h;
  let mi;
  const colon = /^(\d{1,2}):(\d{1,2})$/.exec(s);
  if (colon) {
    h = Number(colon[1]);
    mi = Number(colon[2]);
  } else {
    const digits = s.replace(/\D/g, '');
    if (digits.length === 3) {
      h = Number(digits.slice(0, 1));
      mi = Number(digits.slice(1));
    } else if (digits.length === 4) {
      h = Number(digits.slice(0, 2));
      mi = Number(digits.slice(2));
    } else {
      return null;
    }
  }
  if (!(h >= 0 && h <= 23 && mi >= 0 && mi <= 59)) return null;
  const d = new Date(base);
  d.setHours(h, mi, 0, 0);
  return d;
}

export default function EventFormScreen({ route, navigation }) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.currentUser);
  const addEvent = useEventsStore((s) => s.add);
  const updateEvent = useEventsStore((s) => s.update);
  const removeEvent = useEventsStore((s) => s.remove);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);

  const mode = route.params?.mode || 'create';
  const isEdit = mode === 'edit';

  const [original, setOriginal] = useState(null); // edit: ham DB satırı (notification_id için)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(() =>
    route.params?.startISO ? parseLocal(route.params.startISO) : new Date()
  );
  const [endDate, setEndDate] = useState(() =>
    route.params?.endISO
      ? parseLocal(route.params.endISO)
      : new Date(Date.now() + 60 * 60 * 1000)
  );
  const [categoryId, setCategoryId] = useState(null);
  const [rule, setRule] = useState('none');
  const [recEndDate, setRecEndDate] = useState(null);
  const [reminder, setReminder] = useState(() => useSettingsStore.getState().defaultReminder ?? null);
  const [picker, setPicker] = useState(null); // {field, mode}
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadCategories(user.id);
  }, [user, loadCategories]);

  // Düzenleme: mevcut etkinliği yükle
  useEffect(() => {
    if (isEdit && route.params?.eventId) {
      const ev = getById(route.params.eventId);
      if (ev) {
        // parseLocal bozuk/eksik veride null dönebilir; geçersiz Date state'e girmesin.
        const safe = (d, fb) => (d instanceof Date && !isNaN(d.getTime()) ? d : fb);
        const s = safe(parseLocal(ev.start_time), new Date());
        const e = safe(ev.end_time ? parseLocal(ev.end_time) : null, s);
        setOriginal(ev);
        setTitle(ev.title);
        setDescription(ev.description || '');
        setLocation(ev.location || '');
        setStartDate(s);
        setEndDate(e);
        setCategoryId(ev.category_id ?? null);
        setRule(ev.recurrence_rule || 'none');
        setRecEndDate(safe(ev.recurrence_end_date ? parseLocal(ev.recurrence_end_date) : null, null));
        setReminder(ev.reminder_offset_minutes ?? null);
      }
    }
  }, [isEdit, route.params?.eventId]);

  const onDelete = () => {
    Alert.alert('Etkinliği sil', 'Bu etkinlik (ve tüm tekrarları) silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await removeEvent(user.id, original);
          navigation.goBack();
        },
      },
    ]);
  };

  // .ics olarak paylaş (kaydedilmiş hali). Karşı taraf kendi takvimine ekler.
  const onShare = async () => {
    if (!original) return;
    try {
      await shareEventAsIcs(original);
    } catch (e) {
      Alert.alert('Hata', 'Paylaşım başarısız: ' + (e?.message || ''));
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Etkinliği Düzenle' : 'Yeni Etkinlik',
      headerRight: isEdit
        ? () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginRight: 8 }}>
              <Pressable onPress={onShare} hitSlop={12}>
                <Ionicons name="share-outline" size={22} color={colors.primary} />
              </Pressable>
              <Pressable onPress={onDelete} hitSlop={12}>
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
              </Pressable>
            </View>
          )
        : undefined,
    });
  }, [navigation, isEdit, colors.danger, colors.primary, original]);

  const applyPicked = (picked) => {
    if (!picker || !picked) return;
    const { field, mode: pmode } = picker;
    const apply = (base) => {
      const d = new Date(base || picked);
      if (pmode === 'date') {
        d.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      } else {
        d.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      }
      return d;
    };
    if (field === 'start') {
      const ns = apply(startDate);
      setStartDate(ns);
      if (endDate <= ns) setEndDate(new Date(ns.getTime() + 60 * 60 * 1000));
    } else if (field === 'end') {
      setEndDate(apply(endDate));
    } else if (field === 'recEnd') {
      setRecEndDate(apply(recEndDate || startDate));
    }
  };

  // DateTimePicker'a ASLA geçersiz/null Date gitmemeli: Android'de native picker
  // geçersiz value ile çöker (gece yarısı/bozuk veri kaynaklı en olası native crash).
  const safeDate = (d) => (d instanceof Date && !isNaN(d.getTime()) ? d : new Date());

  const pickerValue = () => {
    if (!picker) return new Date();
    if (picker.field === 'start') return safeDate(startDate);
    if (picker.field === 'end') return safeDate(endDate);
    return safeDate(recEndDate || startDate);
  };

  // Elle saat girişi (HH:MM). Geçersizse sessizce yok say (input eski değere döner).
  const setStartTime = (str) => {
    const ns = parseTimeOnto(startDate, str);
    if (!ns) return;
    setStartDate(ns);
    if (endDate <= ns) setEndDate(new Date(ns.getTime() + 60 * 60 * 1000));
  };
  const setEndTime = (str) => {
    const ne = parseTimeOnto(endDate, str);
    if (ne) setEndDate(ne);
  };

  const onSave = async () => {
    if (!title.trim()) {
      Alert.alert('Eksik bilgi', 'Lütfen bir başlık girin.');
      return;
    }
    if (endDate < startDate) {
      Alert.alert('Geçersiz saat', 'Bitiş, başlangıçtan önce olamaz.');
      return;
    }
    setSaving(true);
    const data = {
      category_id: categoryId,
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      start_time: formatLocal(startDate),
      end_time: formatLocal(endDate),
      recurrence_rule: rule,
      recurrence_end_date: rule !== 'none' && recEndDate ? formatLocal(recEndDate) : null,
      reminder_offset_minutes: reminder,
    };
    try {
      if (isEdit) {
        await updateEvent(user.id, original.id, data, original.notification_id);
      } else {
        await addEvent(user.id, data);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TextField label="Başlık" colors={colors} value={title} onChangeText={setTitle} placeholder="Etkinlik başlığı" />
      <TextField
        label="Açıklama"
        colors={colors}
        value={description}
        onChangeText={setDescription}
        placeholder="(isteğe bağlı)"
        multiline
        style={{ minHeight: 70, textAlignVertical: 'top' }}
      />

      <TextField
        label="Konum"
        colors={colors}
        value={location}
        onChangeText={setLocation}
        placeholder="(isteğe bağlı) örn. A Blok, Sınıf 204"
      />

      <DateRow label="Başlangıç" date={startDate} field="start" colors={colors} onPick={setPicker} onSetTime={setStartTime} />
      <DateRow label="Bitiş" date={endDate} field="end" colors={colors} onPick={setPicker} onSetTime={setEndTime} />

      {/* Kategori */}
      <View>
        <Text style={[styles.sectionLabel, { color: colors.subtext }]}>Kategori</Text>
        <View style={styles.chipWrap}>
          <Chip label="Kategorisiz" active={categoryId == null} color={colors.subtext} onPress={() => setCategoryId(null)} colors={colors} />
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} active={categoryId === c.id} color={c.color} onPress={() => setCategoryId(c.id)} colors={colors} />
          ))}
        </View>
        {categories.length === 0 && (
          <Text style={[styles.note, { color: colors.subtext }]}>
            "Kategoriler" sekmesinden renkli kategori ekleyebilirsiniz.
          </Text>
        )}
      </View>

      {/* Tekrar */}
      <View>
        <Text style={[styles.sectionLabel, { color: colors.subtext }]}>Tekrar</Text>
        <View style={styles.chipWrap}>
          {RULES.map(([val, label]) => (
            <Chip key={val} label={label} active={rule === val} color={colors.primary} onPress={() => setRule(val)} colors={colors} />
          ))}
        </View>
        {rule !== 'none' && (
          <Pressable
            onPress={() => setPicker({ field: 'recEnd', mode: 'date' })}
            style={[styles.recEnd, { borderColor: colors.border }]}
          >
            <Ionicons name="flag-outline" size={16} color={colors.primary} />
            <Text style={[styles.dateBtnText, { color: colors.text }]}>
              {recEndDate ? `Bitiş: ${formatDate(recEndDate)}` : 'Tekrar bitiş tarihi (isteğe bağlı)'}
            </Text>
            {recEndDate && (
              <Pressable onPress={() => setRecEndDate(null)} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={colors.subtext} />
              </Pressable>
            )}
          </Pressable>
        )}
      </View>

      {/* Hatırlatıcı */}
      <View>
        <Text style={[styles.sectionLabel, { color: colors.subtext }]}>Hatırlatıcı</Text>
        <View style={styles.chipWrap}>
          {REMINDERS.map(([val, label]) => (
            <Chip key={String(val)} label={label} active={reminder === val} color={colors.primary} onPress={() => setReminder(val)} colors={colors} />
          ))}
        </View>
      </View>

      <PrimaryButton title={isEdit ? 'Kaydet' : 'Oluştur'} icon="checkmark" onPress={onSave} loading={saving} colors={colors} />
      <View style={{ height: 20 }} />

      {picker && (
        <DateTimePicker
          value={pickerValue()}
          mode={picker.mode}
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setPicker(null);
            if (event.type === 'set' && date) applyPicked(date);
          }}
        />
      )}
    </ScrollView>
  );
}

function DateRow({ label, date, field, colors, onPick, onSetTime }) {
  // Elle giriş için yerel metin; dışarıdan (picker) tarih değişince senkronla.
  const [timeStr, setTimeStr] = useState(formatTime(date));
  useEffect(() => {
    setTimeStr(formatTime(date));
  }, [date]);

  const commit = () => onSetTime(timeStr); // geçersizse handler yok sayar; useEffect geri alır

  return (
    <View style={styles.dateRow}>
      <Text style={[styles.dateLabel, { color: colors.subtext }]}>{label}</Text>
      <View style={styles.dateBtns}>
        <Pressable
          onPress={() => onPick({ field, mode: 'date' })}
          style={[styles.dateBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
        >
          <Ionicons name="calendar-outline" size={15} color={colors.primary} />
          <Text style={[styles.dateBtnText, { color: colors.text }]}>{formatDate(date)}</Text>
        </Pressable>

        {/* Saat: elle yazılabilir (HH:MM); chevron ile picker da açılır */}
        <View style={[styles.dateBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="time-outline" size={15} color={colors.primary} />
          <TextInput
            value={timeStr}
            onChangeText={setTimeStr}
            onEndEditing={commit}
            onSubmitEditing={commit}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            placeholder="SS:DD"
            placeholderTextColor={colors.subtext}
            style={[styles.timeInput, { color: colors.text }]}
          />
          <Pressable onPress={() => onPick({ field, mode: 'time' })} hitSlop={8}>
            <Ionicons name="chevron-down" size={16} color={colors.subtext} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Chip({ label, active, color, onPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: color, backgroundColor: active ? color : 'transparent' },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  dateRow: { gap: 8 },
  dateLabel: { fontSize: 13, fontWeight: '600' },
  dateBtns: { flexDirection: 'row', gap: 10 },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
  },
  dateBtnText: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  timeInput: { flex: 1, fontSize: 14, fontWeight: '600', paddingVertical: 0 },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontSize: 13, fontWeight: '600' },
  note: { fontSize: 12, marginTop: 8 },
  recEnd: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
  },
});
