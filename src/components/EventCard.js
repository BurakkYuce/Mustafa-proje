import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTime } from '../utils/dateUtils';

const RULE_LABEL = {
  daily: 'Her gün',
  weekly: 'Her hafta',
  monthly: 'Her ay',
};

export default function EventCard({ occurrence, color, onPress, colors }) {
  const { event, start, end } = occurrence;
  const timeLabel = end
    ? `${formatTime(start)} - ${formatTime(end)}`
    : formatTime(start);
  const rule = RULE_LABEL[event.recurrence_rule];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.stripe, { backgroundColor: color }]} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={colors.subtext} />
          <Text style={[styles.meta, { color: colors.subtext }]}>{timeLabel}</Text>
          {rule ? (
            <>
              <Ionicons name="repeat" size={13} color={colors.subtext} />
              <Text style={[styles.meta, { color: colors.subtext }]}>{rule}</Text>
            </>
          ) : null}
        </View>
        {event.description ? (
          <Text style={[styles.desc, { color: colors.subtext }]} numberOfLines={1}>
            {event.description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  stripe: { width: 5, alignSelf: 'stretch', borderRadius: 3, marginRight: 10 },
  body: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  meta: { fontSize: 12, marginRight: 6 },
  desc: { fontSize: 12 },
});
