// Basit yatay bar chart — ekstra kütüphane yok, sadece View tabanlı.
// Offline ortamda en sağlam çözüm (recharts React Native'de çalışmaz).
import { View, Text, StyleSheet } from 'react-native';

export default function BarChart({ data, colors }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <View style={styles.wrap}>
      {data.map((d, i) => (
        <View key={`${d.name}-${i}`} style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
            {d.name}
          </Text>
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.bar,
                {
                  backgroundColor: d.color,
                  width: `${Math.round((d.count / max) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.count, { color: colors.subtext }]}>{d.count}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { width: 90, fontSize: 13, fontWeight: '600' },
  track: { flex: 1, height: 18, borderRadius: 9, overflow: 'hidden' },
  bar: { height: 18, borderRadius: 9, minWidth: 6 },
  count: { width: 28, textAlign: 'right', fontSize: 13, fontWeight: '700' },
});
