// Zamanlayıcı (geri sayım). Süre dolunca titreşim + bildirim.
// Arka planda da çalsın diye başlatınca bitiş anına tek seferlik bildirim planlanır;
// duraklat/sıfırla'da bu bildirim iptal edilir.
import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Vibration } from 'react-native';
import { scheduleOneShot, cancelNotif } from '../../services/notificationService';

const pad = (n) => String(n).padStart(2, '0');

function fmt(totalSec) {
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const PRESETS = [
  [60, '1 dk'],
  [180, '3 dk'],
  [300, '5 dk'],
  [600, '10 dk'],
];

export default function Timer({ colors }) {
  const [totalSec, setTotalSec] = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [running, setRunning] = useState(false);
  const endRef = useRef(0);
  const tickRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => () => clearInterval(tickRef.current), []);

  const start = async () => {
    if (remaining <= 0) return;
    const endAt = Date.now() + remaining * 1000;
    endRef.current = endAt;
    notifRef.current = await scheduleOneShot(new Date(endAt), 'Zamanlayıcı bitti', 'Süre doldu ⏱️');
    tickRef.current = setInterval(() => {
      const left = Math.round((endRef.current - Date.now()) / 1000);
      if (left <= 0) finish();
      else setRemaining(left);
    }, 250);
    setRunning(true);
  };

  const finish = () => {
    clearInterval(tickRef.current);
    setRemaining(0);
    setRunning(false);
    Vibration.vibrate([0, 500, 250, 500]);
  };

  const pause = async () => {
    clearInterval(tickRef.current);
    setRunning(false);
    await cancelNotif(notifRef.current);
    notifRef.current = null;
  };

  const reset = async () => {
    clearInterval(tickRef.current);
    setRunning(false);
    setRemaining(totalSec);
    await cancelNotif(notifRef.current);
    notifRef.current = null;
  };

  const setPreset = (sec) => {
    setTotalSec(sec);
    setRemaining(sec);
  };

  const bump = (deltaSec) => {
    const next = Math.max(0, Math.min(99 * 60, totalSec + deltaSec));
    setTotalSec(next);
    setRemaining(next);
  };

  const idle = !running && remaining === totalSec;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.time, { color: remaining === 0 ? colors.danger : colors.text }]}>
        {fmt(remaining)}
      </Text>

      {/* Ayar (yalnızca durdurulmuş ve başa sarılmışken) */}
      {idle && (
        <>
          <View style={styles.stepRow}>
            <StepBtn label="-1dk" onPress={() => bump(-60)} colors={colors} />
            <StepBtn label="-10sn" onPress={() => bump(-10)} colors={colors} />
            <StepBtn label="+10sn" onPress={() => bump(10)} colors={colors} />
            <StepBtn label="+1dk" onPress={() => bump(60)} colors={colors} />
          </View>
          <View style={styles.presetRow}>
            {PRESETS.map(([sec, label]) => (
              <Pressable
                key={sec}
                onPress={() => setPreset(sec)}
                style={[
                  styles.preset,
                  { borderColor: colors.primary },
                  totalSec === sec && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[styles.presetText, { color: totalSec === sec ? '#fff' : colors.text }]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <View style={styles.row}>
        <CircleBtn
          label="Sıfırla"
          onPress={reset}
          disabled={idle}
          colors={colors}
          variant="ghost"
        />
        <CircleBtn
          label={running ? 'Duraklat' : remaining === 0 ? 'Bitti' : remaining < totalSec ? 'Devam' : 'Başlat'}
          onPress={running ? pause : start}
          disabled={remaining === 0}
          colors={colors}
          variant={running ? 'danger' : 'primary'}
        />
      </View>
    </View>
  );
}

function StepBtn({ label, onPress, colors }) {
  return (
    <Pressable onPress={onPress} style={[styles.step, { borderColor: colors.border }]}>
      <Text style={[styles.stepText, { color: colors.primary }]}>{label}</Text>
    </Pressable>
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
  wrap: { flex: 1, alignItems: 'center', paddingTop: 36 },
  time: { fontSize: 64, fontWeight: '200', fontVariant: ['tabular-nums'] },
  stepRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
  step: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  stepText: { fontSize: 14, fontWeight: '700' },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  preset: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  presetText: { fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 40, marginTop: 40 },
  circle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  circleText: { fontSize: 15, fontWeight: '700' },
});
