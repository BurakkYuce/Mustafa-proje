import { Pressable, Text, View, StyleSheet } from 'react-native';

export default function CategoryPill({ name, color, selected, onPress, onLongPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? color : colors.card,
          borderColor: color,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: selected ? colors.card : color }]} />
      <Text
        style={[
          styles.text,
          { color: selected ? '#ffffff' : colors.text },
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 8,
    gap: 6,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  text: { fontSize: 13, fontWeight: '600', maxWidth: 140 },
});
