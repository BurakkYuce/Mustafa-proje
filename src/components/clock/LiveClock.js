// Canlı saat: her saniye güncellenen büyük saat + tarih.
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDate } from '../../utils/dateUtils';

const pad = (n) => String(n).padStart(2, '0');

export default function LiveClock({ colors }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.time, { color: colors.text }]}>
        {pad(now.getHours())}:{pad(now.getMinutes())}
        <Text style={[styles.sec, { color: colors.primary }]}>:{pad(now.getSeconds())}</Text>
      </Text>
      <Text style={[styles.date, { color: colors.subtext }]}>{formatDate(now)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  time: { fontSize: 64, fontWeight: '200', letterSpacing: 1, fontVariant: ['tabular-nums'] },
  sec: { fontSize: 64, fontWeight: '200' },
  date: { fontSize: 16, marginTop: 8, fontWeight: '600' },
});
