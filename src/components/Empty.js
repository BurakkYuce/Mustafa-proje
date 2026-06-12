import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Empty({ text, icon = 'file-tray-outline', colors }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={48} color={colors.subtext} />
      <Text style={[styles.text, { color: colors.subtext }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  text: { fontSize: 15, textAlign: 'center' },
});
