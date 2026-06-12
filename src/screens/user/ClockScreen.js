// Saat sekmesi: Saat / Kronometre / Zamanlayıcı / Alarm.
// Üstte segment seçici, altta seçilen araç. Hepsi offline çalışır.
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../../utils/useTheme';
import LiveClock from '../../components/clock/LiveClock';
import Stopwatch from '../../components/clock/Stopwatch';
import Timer from '../../components/clock/Timer';
import AlarmList from '../../components/clock/AlarmList';

const TABS = [
  ['clock', 'Saat'],
  ['stopwatch', 'Kronometre'],
  ['timer', 'Zamanlayıcı'],
  ['alarm', 'Alarm'],
];

export default function ClockScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState('clock');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Segment seçici */}
      <View style={[styles.segment, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {TABS.map(([key, label]) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[styles.segItem, active && { backgroundColor: colors.primary }]}
            >
              <Text
                style={[styles.segText, { color: active ? '#fff' : colors.subtext }]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'clock' && <LiveClock colors={colors} />}
        {tab === 'stopwatch' && <Stopwatch colors={colors} />}
        {tab === 'timer' && <Timer colors={colors} />}
        {tab === 'alarm' && <AlarmList colors={colors} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    margin: 12,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segText: { fontSize: 13, fontWeight: '700' },
});
