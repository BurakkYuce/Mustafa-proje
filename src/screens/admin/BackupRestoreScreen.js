import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { exportAllToJson, importJsonFile } from '../../services/backupService';
import { useTheme } from '../../utils/useTheme';
import { PrimaryButton } from '../../components/ui';

export default function BackupRestoreScreen() {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(null); // 'export' | 'import' | null

  const onExport = async () => {
    setBusy('export');
    try {
      const res = await exportAllToJson();
      Alert.alert(
        'Yedek oluşturuldu',
        `Kullanıcı: ${res.counts.users}\nKategori: ${res.counts.categories}\nEtkinlik: ${res.counts.events}\n\nPaylaşım menüsünden dosyayı kaydedebilirsiniz.`
      );
    } catch (e) {
      Alert.alert('Hata', 'Yedekleme başarısız: ' + e.message);
    } finally {
      setBusy(null);
    }
  };

  const onImport = () => {
    Alert.alert(
      'Geri yükle',
      'Seçilen JSON yedeği yüklenecek ve MEVCUT TÜM VERİLER silinecek. Devam edilsin mi?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Devam',
          style: 'destructive',
          onPress: async () => {
            setBusy('import');
            try {
              const res = await importJsonFile();
              if (res.canceled) return;
              Alert.alert(
                'Geri yükleme tamam',
                `Yüklendi:\nKullanıcı: ${res.counts.users}\nKategori: ${res.counts.categories}\nEtkinlik: ${res.counts.events}`
              );
            } catch (e) {
              Alert.alert('Hata', 'Geri yükleme başarısız: ' + e.message);
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="cloud-upload-outline" size={30} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>JSON Yedekleme</Text>
        <Text style={[styles.desc, { color: colors.subtext }]}>
          Tüm tabloları (kullanıcılar, kategoriler, etkinlikler) tek bir JSON dosyasına aktarır.
          Tamamen cihaz üzerinde, internet gerektirmez.
        </Text>
        <PrimaryButton title="Yedeği Dışa Aktar" icon="download-outline" onPress={onExport} loading={busy === 'export'} colors={colors} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="cloud-download-outline" size={30} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Geri Yükleme</Text>
        <Text style={[styles.desc, { color: colors.subtext }]}>
          Bir JSON yedeğinden veritabanını geri yükler.
        </Text>
        <View style={[styles.warn, { borderColor: colors.danger }]}>
          <Ionicons name="warning-outline" size={18} color={colors.danger} />
          <Text style={[styles.warnText, { color: colors.danger }]}>
            Bu işlem mevcut tüm verilerin üzerine yazar.
          </Text>
        </View>
        <PrimaryButton title="Yedekten İçe Aktar" icon="folder-open-outline" variant="ghost" onPress={onImport} loading={busy === 'import'} colors={colors} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 12, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800' },
  desc: { fontSize: 14, lineHeight: 20 },
  warn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch',
    borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, padding: 10,
  },
  warnText: { fontSize: 13, fontWeight: '600', flex: 1 },
});
