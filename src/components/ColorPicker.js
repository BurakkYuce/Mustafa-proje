import { View, Pressable, StyleSheet } from 'react-native';
import { CATEGORY_COLORS } from '../utils/theme';

export default function ColorPicker({ value, onChange }) {
  return (
    <View style={styles.wrap}>
      {CATEGORY_COLORS.map((c) => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          style={[
            styles.swatch,
            { backgroundColor: c },
            value === c && styles.selected,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  selected: { borderWidth: 3, borderColor: '#ffffff', transform: [{ scale: 1.15 }] },
});
