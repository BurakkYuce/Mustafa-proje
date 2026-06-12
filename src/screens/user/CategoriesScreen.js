import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthStore } from '../../store/authStore';
import { useCategoriesStore } from '../../store/categoriesStore';
import { useTheme } from '../../utils/useTheme';
import { TextField, PrimaryButton } from '../../components/ui';
import ColorPicker from '../../components/ColorPicker';
import Empty from '../../components/Empty';
import { CATEGORY_COLORS } from '../../utils/theme';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.currentUser);
  const categories = useCategoriesStore((s) => s.categories);
  const load = useCategoriesStore((s) => s.load);
  const add = useCategoriesStore((s) => s.add);
  const update = useCategoriesStore((s) => s.update);
  const remove = useCategoriesStore((s) => s.remove);

  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[10]);

  useFocusEffect(
    useCallback(() => {
      if (user) load(user.id);
    }, [user, load])
  );

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setColor(CATEGORY_COLORS[10]);
    setVisible(true);
  };

  const openEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color);
    setVisible(true);
  };

  const onSave = () => {
    if (!name.trim()) {
      Alert.alert('Eksik bilgi', 'Kategori adı girin.');
      return;
    }
    if (editingId) update(user.id, editingId, name.trim(), color);
    else add(user.id, name.trim(), color);
    setVisible(false);
  };

  const onDelete = (cat) => {
    Alert.alert('Kategoriyi sil', `"${cat.name}" silinsin mi? Bu kategorideki etkinlikler "Kategorisiz" olur.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => remove(user.id, cat.id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 90 }}>
        {categories.length === 0 ? (
          <Empty text="Henüz kategori yok. Sağ alttaki + ile ekleyin." icon="pricetags-outline" colors={colors} />
        ) : (
          categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => openEdit(cat)}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.dot, { backgroundColor: cat.color }]} />
              <Text style={[styles.name, { color: colors.text }]}>{cat.name}</Text>
              <Pressable onPress={() => openEdit(cat)} hitSlop={8} style={styles.action}>
                <Ionicons name="create-outline" size={20} color={colors.subtext} />
              </Pressable>
              <Pressable onPress={() => onDelete(cat)} hitSlop={8} style={styles.action}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Pressable onPress={openAdd} style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {editingId ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
          </Text>
          <TextField label="Ad" colors={colors} value={name} onChangeText={setName} placeholder="Örn. İş, Okul, Spor" />
          <Text style={[styles.pickLabel, { color: colors.subtext }]}>Renk</Text>
          <ColorPicker value={color} onChange={setColor} />
          <View style={{ height: 16 }} />
          <PrimaryButton title="Kaydet" icon="checkmark" onPress={onSave} colors={colors} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10,
  },
  dot: { width: 22, height: 22, borderRadius: 11 },
  name: { flex: 1, fontSize: 16, fontWeight: '600' },
  action: { padding: 4 },
  fab: {
    position: 'absolute', right: 18, bottom: 18, width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center', elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  pickLabel: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 8 },
});
