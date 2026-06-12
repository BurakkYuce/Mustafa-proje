import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthStore } from '../../store/authStore';
import { useEventsStore } from '../../store/eventsStore';
import { useCategoriesStore } from '../../store/categoriesStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTheme } from '../../utils/useTheme';
import { expandMany } from '../../utils/recurrence';
import {
  startOfDay, endOfDay, startOfMonth, endOfMonth, addDays,
  dateKey, parseLocal, formatLocal, formatDate,
} from '../../utils/dateUtils';
import DayTimeline from '../../components/DayTimeline';
import EventCard from '../../components/EventCard';
import CategoryPill from '../../components/CategoryPill';
import Empty from '../../components/Empty';

// Türkçe takvim yerelleştirmesi
LocaleConfig.locales.tr = {
  monthNames: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  today: 'Bugün',
};
LocaleConfig.defaultLocale = 'tr';

const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']; // getDay() ile indekslenir
const DEFAULT_COLOR = '#9ca3af';

function startOfWeek(d, firstDay) {
  const x = startOfDay(d);
  const offset = (x.getDay() - firstDay + 7) % 7;
  return addDays(x, -offset);
}

export default function CalendarScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.currentUser);
  const events = useEventsStore((s) => s.events);
  const loadEvents = useEventsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const activeFilter = useCategoriesStore((s) => s.activeFilter);
  const setFilter = useCategoriesStore((s) => s.setFilter);
  const firstDayOfWeek = useSettingsStore((s) => s.firstDayOfWeek);

  const [viewMode, setViewMode] = useState(() => useSettingsStore.getState().defaultView); // 'day' | 'week' | 'month'
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadEvents(user.id);
        loadCategories(user.id);
      }
    }, [user, loadEvents, loadCategories])
  );

  const colorMap = useMemo(() => {
    const m = {};
    categories.forEach((c) => { m[c.id] = c.color; });
    return m;
  }, [categories]);

  const colorOf = useCallback(
    (event) => colorMap[event.category_id] || DEFAULT_COLOR,
    [colorMap]
  );

  const filteredEvents = useMemo(
    () => (activeFilter ? events.filter((e) => e.category_id === activeFilter) : events),
    [events, activeFilter]
  );

  const dayOccurrences = useCallback(
    (day) => expandMany(filteredEvents, startOfDay(day), endOfDay(day)),
    [filteredEvents]
  );

  // Ay görünümü için işaretli günler (çok noktalı)
  const markedDates = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const occs = expandMany(filteredEvents, monthStart, monthEnd);
    const marks = {};
    occs.forEach((occ) => {
      const key = dateKey(occ.start);
      if (!marks[key]) marks[key] = { dots: [] };
      if (marks[key].dots.length < 4) {
        marks[key].dots.push({ key: occ.key, color: colorOf(occ.event) });
      }
    });
    const selKey = dateKey(selectedDate);
    marks[selKey] = {
      ...(marks[selKey] || {}),
      selected: true,
      selectedColor: colors.primary,
    };
    return marks;
  }, [filteredEvents, selectedDate, colorOf, colors.primary]);

  const goToForm = (start, end) =>
    navigation.navigate('EventForm', {
      mode: 'create',
      startISO: formatLocal(start),
      endISO: formatLocal(end),
    });

  const editEvent = (occ) =>
    navigation.navigate('EventForm', { mode: 'edit', eventId: occ.event.id });

  const onFabPress = () => {
    const now = new Date();
    const start = new Date(selectedDate);
    const isToday = dateKey(now) === dateKey(selectedDate);
    start.setHours(isToday ? now.getHours() + 1 : 9, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    goToForm(start, end);
  };

  const calTheme = useMemo(
    () => ({
      calendarBackground: colors.card,
      dayTextColor: colors.text,
      monthTextColor: colors.text,
      textSectionTitleColor: colors.subtext,
      todayTextColor: colors.primary,
      selectedDayTextColor: '#ffffff',
      arrowColor: colors.primary,
      textDisabledColor: colors.border,
    }),
    [colors]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Görünüm modu */}
      <View style={[styles.segment, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          ['day', 'Gün'],
          ['week', 'Hafta'],
          ['month', 'Ay'],
        ].map(([mode, label]) => (
          <Pressable
            key={mode}
            onPress={() => setViewMode(mode)}
            style={[styles.segItem, viewMode === mode && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.segText, { color: viewMode === mode ? '#fff' : colors.text }]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Kategori renk filtresi */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 12 }}>
          {categories.map((c) => (
            <CategoryPill
              key={c.id}
              name={c.name}
              color={c.color}
              selected={activeFilter === c.id}
              onPress={() => setFilter(c.id)}
              colors={colors}
            />
          ))}
        </ScrollView>
      )}

      {/* Mod içeriği */}
      {viewMode === 'month' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 90 }}>
          <Calendar
            key={isDark ? 'd' : 'l'}
            current={dateKey(selectedDate)}
            firstDay={firstDayOfWeek}
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={(d) => setSelectedDate(parseLocal(d.dateString))}
            onMonthChange={(d) => setSelectedDate(parseLocal(d.dateString))}
            theme={calTheme}
            style={{ borderBottomWidth: 1, borderColor: colors.border }}
          />
          <Text style={[styles.agendaTitle, { color: colors.text }]}>{formatDate(selectedDate)}</Text>
          <View style={{ paddingHorizontal: 12 }}>
            {dayOccurrences(selectedDate).length === 0 ? (
              <Empty text="Bu gün için etkinlik yok" icon="calendar-outline" colors={colors} />
            ) : (
              dayOccurrences(selectedDate).map((occ) => (
                <EventCard key={occ.key} occurrence={occ} color={colorOf(occ.event)} onPress={() => editEvent(occ)} colors={colors} />
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {viewMode === 'week' ? (
            <View style={[styles.weekStrip, { borderColor: colors.border }]}>
              {Array.from({ length: 7 }).map((_, i) => {
                const d = addDays(startOfWeek(selectedDate, firstDayOfWeek), i);
                const sel = dateKey(d) === dateKey(selectedDate);
                const isToday = dateKey(d) === dateKey(new Date());
                return (
                  <Pressable key={i} onPress={() => setSelectedDate(d)} style={[styles.weekDay, sel && { backgroundColor: colors.primary }]}>
                    <Text style={[styles.weekDayName, { color: sel ? '#fff' : colors.subtext }]}>{DAY_LABELS[d.getDay()]}</Text>
                    <Text style={[styles.weekDayNum, { color: sel ? '#fff' : isToday ? colors.primary : colors.text }]}>
                      {d.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={[styles.dayHeader, { borderColor: colors.border }]}>
              <Pressable onPress={() => setSelectedDate(addDays(selectedDate, -1))} hitSlop={10}>
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => setSelectedDate(new Date())}>
                <Text style={[styles.dayHeaderText, { color: colors.text }]}>{formatDate(selectedDate)}</Text>
              </Pressable>
              <Pressable onPress={() => setSelectedDate(addDays(selectedDate, 1))} hitSlop={10}>
                <Ionicons name="chevron-forward" size={24} color={colors.primary} />
              </Pressable>
            </View>
          )}

          <DayTimeline
            date={selectedDate}
            occurrences={dayOccurrences(selectedDate)}
            colorOf={colorOf}
            onCreate={goToForm}
            onPressEvent={editEvent}
            colors={colors}
          />
        </View>
      )}

      {/* Ekle (FAB) */}
      <Pressable onPress={onFabPress} style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  segment: { flexDirection: 'row', margin: 12, borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  segItem: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  segText: { fontSize: 14, fontWeight: '700' },
  filterRow: { maxHeight: 48, flexGrow: 0 },
  agendaTitle: { fontSize: 16, fontWeight: '800', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  weekStrip: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 6 },
  weekDay: { flex: 1, alignItems: 'center', paddingVertical: 6, marginHorizontal: 3, borderRadius: 10 },
  weekDayName: { fontSize: 11, fontWeight: '600' },
  weekDayNum: { fontSize: 17, fontWeight: '700', marginTop: 2 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  dayHeaderText: { fontSize: 16, fontWeight: '800' },
  fab: {
    position: 'absolute', right: 18, bottom: 18, width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center', elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
});
