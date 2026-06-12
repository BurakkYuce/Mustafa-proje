// Kronometre: başlat / duraklat / sıfırla + tur (lap).
// Sürükleme/yeniden render'dan etkilenmesin diye geçen süre ref'lerle hesaplanır.
import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';

const pad = (n, l = 2) => String(n).padStart(l, '0');

export function formatMs(ms) {
  const cs = Math.floor((ms % 1000) / 10);
  const totalSec = Math.floor(ms / 1000);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  return h > 0
    ? `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`
    : `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

export default function Stopwatch({ colors }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const startRef = useRef(0);
  const accRef = useRef(0);
  const tickRef = useRef(null);

  useEffect(() => () => clearInterval(tickRef.current), []);

  const start = () => {
    startRef.current = Date.now();
    tickRef.current = setInterval(
      () => setElapsed(accRef.current + (Date.now() - startRef.current)),
      30
    );
    setRunning(true);
  };

  const pause = () => {
    clearInterval(tickRef.current);
    accRef.current += Date.now() - startRef.current;
    setElapsed(accRef.current);
    setRunning(false);
  };

  const reset = () => {
    clearInterval(tickRef.current);
    accRef.current = 0;
    setElapsed(0);
    setLaps([]);
    setRunning(false);
  };

  const lap = () => setLaps((l) => [elapsed, ...l]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.time, { color: colors.text }]}>{formatMs(elapsed)}</Text>

      <View style={styles.row}>
        {/* Sol buton: çalışırken Tur, dururken Sıfırla */}
        <CircleBtn
          label={running ? 'Tur' : 'Sıfırla'}
          onPress={running ? lap : reset}
          disabled={!running && elapsed === 0}
          colors={colors}
          variant="ghost"
        />
        {/* Sağ buton: Başlat / Duraklat */}
        <CircleBtn
          label={running ? 'Duraklat' : elapsed > 0 ? 'Devam' : 'Başlat'}
          onPress={running ? pause : start}
          colors={colors}
          variant={running ? 'danger' : 'primary'}
        />
      </View>

      {laps.length > 0 && (
        <ScrollView style={styles.laps} contentContainerStyle={{ paddingBottom: 12 }}>
          {laps.map((t, i) => (
            <View key={i} style={[styles.lapRow, { borderColor: colors.border }]}>
              <Text style={[styles.lapLabel, { color: colors.subtext }]}>
                Tur {laps.length - i}
              </Text>
              <Text style={[styles.lapTime, { color: colors.text }]}>{formatMs(t)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function CircleBtn({ label, onPress, disabled, colors, variant }) {
  const bg =
    variant === 'danger' ? colors.danger : variant === 'ghost' ? 'transparent' : colors.primary;
  const fg = variant === 'ghost' ? colors.text : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.circle,
        {
          backgroundColor: bg,
          borderColor: colors.border,
          borderWidth: variant === 'ghost' ? 1.5 : 0,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <Text style={[styles.circleText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingTop: 40 },
  time: { fontSize: 60, fontWeight: '200', fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', gap: 40, marginTop: 36 },
  circle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  circleText: { fontSize: 15, fontWeight: '700' },
  laps: { alignSelf: 'stretch', marginTop: 28, paddingHorizontal: 8 },
  lapRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1 },
  lapLabel: { fontSize: 14, fontWeight: '600' },
  lapTime: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
