// Üst seviye hata sınırı: ağaçtaki herhangi bir render hatasında uygulamayı
// kapatmak yerine hatayı EKRANDA gösterir. Hem güvenlik ağı (beklenmedik bir
// durumda app çökmez) hem de teşhis aracı (release build'de gizli hatayı görünür kılar).
// NOT: React ErrorBoundary yalnızca render sırasındaki JS hatalarını yakalar;
// native çökmeleri (örn. geçersiz value'lu DateTimePicker) yakalayamaz — onlar
// ayrıca guard'landı.
import { Component } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary yakaladı:', error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Bir hata oluştu</Text>
          <Text style={styles.label}>Mesaj</Text>
          <Text style={styles.msg}>{String(error?.message || error)}</Text>
          <Text style={styles.label}>Detay (geliştiriciye iletmek için)</Text>
          <Text style={styles.stack}>{String(error?.stack || '').slice(0, 1200)}</Text>
          <Pressable style={styles.btn} onPress={this.reset}>
            <Text style={styles.btnText}>Tekrar dene</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0f1115' },
  scroll: { padding: 24, paddingTop: 80, gap: 8 },
  emoji: { fontSize: 40, textAlign: 'center' },
  title: { color: '#f3f4f6', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  label: { color: '#9ca3af', fontSize: 12, fontWeight: '700', marginTop: 12 },
  msg: { color: '#f87171', fontSize: 15, fontWeight: '600' },
  stack: { color: '#9ca3af', fontSize: 11, fontFamily: 'monospace', lineHeight: 16 },
  btn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
