// Ana ekran widget'ının görünümü. react-native-android-widget'ın özel
// bileşenleriyle çizilir (normal RN bileşenleri DEĞİL).

import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function TodayWidget({ events = [] }) {
  const shown = events.slice(0, 5);
  const extra = events.length - shown.length;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
      }}
    >
      <TextWidget
        text="Bugün"
        style={{ fontSize: 16, fontFamily: 'sans-serif-medium', color: '#111827', marginBottom: 6 }}
      />

      {shown.length === 0 ? (
        <TextWidget text="Bugün için etkinlik yok" style={{ fontSize: 13, color: '#6b7280' }} />
      ) : (
        shown.map((e, i) => (
          <FlexWidget key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: e.color, marginRight: 8 }} />
            <TextWidget text={`${e.timeLabel}  ${e.title}`} style={{ fontSize: 13, color: '#111827' }} />
          </FlexWidget>
        ))
      )}

      {extra > 0 ? (
        <TextWidget text={`+${extra} etkinlik daha`} style={{ fontSize: 12, color: '#2563eb', marginTop: 4 }} />
      ) : null}
    </FlexWidget>
  );
}
