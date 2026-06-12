// Saatlik gün timeline'ı (0–24).
// - Normal mod: bir saat satırına DOKUN -> o saatte 1 saatlik etkinlik oluştur.
// - "Sürükle" modu: parmağı sürükleyerek saat aralığı seç -> bırakınca o aralıkla oluştur.
//   (Kaydırma ile sürükleme çakışmasın diye sürükleme ayrı bir modla açılır; mod aktifken
//    ScrollView kaydırması kapatılır. Demo'da güvenilir çalışır.)
// Etkinlik bloğuna dokun -> düzenle.

import { useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, PanResponder, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTime, isSameDay } from '../utils/dateUtils';

const HOUR_HEIGHT = 60;
const GUTTER = 52;
const CONTENT_HEIGHT = HOUR_HEIGHT * 24;

// Y (px) -> dakikaya çevir, 15 dk'ya yuvarla.
function yToMinutes(y) {
  const m = Math.round(((y / HOUR_HEIGHT) * 60) / 15) * 15;
  return Math.max(0, Math.min(24 * 60, m));
}

export default function DayTimeline({ date, occurrences, colorOf, onCreate, onPressEvent, colors }) {
  const [dragMode, setDragMode] = useState(false);
  const [sel, setSel] = useState(null); // {a, b} px
  const selRef = useRef(null);

  const mkDate = (totalMin) => {
    const d = new Date(date);
    d.setHours(Math.floor(totalMin / 60), totalMin % 60, 0, 0);
    return d;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => selRef.current?.enabled,
      onMoveShouldSetPanResponder: () => selRef.current?.enabled,
      onPanResponderGrant: (e) => {
        const y = e.nativeEvent.locationY;
        setSel({ a: y, b: y });
      },
      onPanResponderMove: (e) => {
        const y = e.nativeEvent.locationY;
        setSel((s) => (s ? { a: s.a, b: y } : { a: y, b: y }));
      },
      onPanResponderRelease: () => {
        const cur = selRef.current;
        if (cur && cur.sel) {
          let m1 = yToMinutes(Math.min(cur.sel.a, cur.sel.b));
          let m2 = yToMinutes(Math.max(cur.sel.a, cur.sel.b));
          if (m2 - m1 < 15) m2 = Math.min(24 * 60, m1 + 60); // minimum 1 saat
          // Güncel seçili güne göre tarih kur (closure bayatlamasını ref ile önlüyoruz).
          const mk = (totalMin) => {
            const d = new Date(cur.date);
            d.setHours(Math.floor(totalMin / 60), totalMin % 60, 0, 0);
            return d;
          };
          cur.onCreate(mk(m1), mk(m2));
        }
        setSel(null);
        setDragMode(false);
      },
      onPanResponderTerminate: () => {
        setSel(null);
        setDragMode(false);
      },
    })
  ).current;

  // PanResponder closure'ı güncel state'i görsün diye ref ile köprü kuruyoruz.
  selRef.current = { enabled: dragMode, sel, onCreate, date };

  const today = isSameDay(date, new Date());
  const nowMin = today ? new Date().getHours() * 60 + new Date().getMinutes() : null;

  return (
    <View style={styles.container}>
      <View style={[styles.toolbar, { borderColor: colors.border }]}>
        <Text style={[styles.hint, { color: colors.subtext }]}>
          {dragMode ? 'Saat aralığını sürükleyerek seçin' : 'Saate dokunarak etkinlik ekleyin'}
        </Text>
        <Pressable
          onPress={() => setDragMode((v) => !v)}
          style={[
            styles.dragBtn,
            { borderColor: colors.primary, backgroundColor: dragMode ? colors.primary : 'transparent' },
          ]}
        >
          <Ionicons name="resize" size={15} color={dragMode ? '#fff' : colors.primary} />
          <Text style={[styles.dragBtnText, { color: dragMode ? '#fff' : colors.primary }]}>
            Sürükle
          </Text>
        </Pressable>
      </View>

      <ScrollView
        scrollEnabled={!dragMode}
        contentContainerStyle={{ height: CONTENT_HEIGHT }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: CONTENT_HEIGHT }}>
          {/* Saat çizgileri + dokunulabilir slotlar */}
          {Array.from({ length: 24 }).map((_, h) => (
            <View key={h} style={[styles.hourRow, { top: h * HOUR_HEIGHT, borderColor: colors.timelineLine }]}>
              <Text style={[styles.hourLabel, { color: colors.subtext }]}>
                {String(h).padStart(2, '0')}:00
              </Text>
              <Pressable
                disabled={dragMode}
                onPress={() => onCreate(mkDate(h * 60), mkDate(Math.min(24 * 60, (h + 1) * 60)))}
                style={styles.slot}
              />
            </View>
          ))}

          {/* Şu an çizgisi */}
          {nowMin != null && (
            <View style={[styles.nowLine, { top: (nowMin / 60) * HOUR_HEIGHT }]}>
              <View style={[styles.nowDot, { backgroundColor: colors.danger }]} />
              <View style={[styles.nowBar, { backgroundColor: colors.danger }]} />
            </View>
          )}

          {/* Etkinlik blokları */}
          {occurrences.map((occ) => {
            const startMin = occ.start.getHours() * 60 + occ.start.getMinutes();
            let endMin = occ.end
              ? occ.end.getHours() * 60 + occ.end.getMinutes()
              : startMin + 60;
            if (!occ.end || endMin <= startMin) endMin = Math.min(24 * 60, startMin + 60);
            const top = (startMin / 60) * HOUR_HEIGHT;
            const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24);
            const color = colorOf(occ.event);
            return (
              <Pressable
                key={occ.key}
                onPress={() => onPressEvent(occ)}
                style={[styles.event, { top, height, left: GUTTER + 4, backgroundColor: color + '26', borderColor: color }]}
              >
                <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>
                  {occ.event.title}
                </Text>
                {height > 34 && (
                  <Text style={[styles.eventTime, { color: colors.subtext }]} numberOfLines={1}>
                    {formatTime(occ.start)}
                    {occ.end ? ` - ${formatTime(occ.end)}` : ''}
                  </Text>
                )}
              </Pressable>
            );
          })}

          {/* Sürükleme seçim dikdörtgeni */}
          {sel && (
            <View
              pointerEvents="none"
              style={[
                styles.selection,
                {
                  top: Math.min(sel.a, sel.b),
                  height: Math.abs(sel.b - sel.a),
                  left: GUTTER + 4,
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + '33',
                },
              ]}
            />
          )}

          {/* Sürükleme overlay'i: yalnızca sürükle modunda, tüm içeriği kaplar.
              Böylece dokunulan hedef hep bu tam-yükseklikli view olur ve
              locationY 24 saatlik içeriğe göreli gelir (tek saate değil). */}
          {dragMode && (
            <View
              style={styles.dragOverlay}
              {...panResponder.panHandlers}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  hint: { fontSize: 12, flex: 1 },
  dragBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dragBtnText: { fontSize: 13, fontWeight: '700' },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HOUR_HEIGHT,
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  hourLabel: { width: GUTTER, fontSize: 11, marginTop: -7, paddingLeft: 8 },
  slot: { flex: 1 },
  event: {
    position: 'absolute',
    right: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    justifyContent: 'center',
  },
  eventTitle: { fontSize: 13, fontWeight: '700' },
  eventTime: { fontSize: 11 },
  nowLine: { position: 'absolute', left: GUTTER - 4, right: 0, flexDirection: 'row', alignItems: 'center' },
  nowDot: { width: 8, height: 8, borderRadius: 4 },
  nowBar: { flex: 1, height: 1.5 },
  selection: {
    position: 'absolute',
    right: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  dragOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CONTENT_HEIGHT,
    zIndex: 20,
  },
});
