import { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../utils/useTheme';
import { TextField, PrimaryButton } from '../../components/ui';

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (!res.ok) setError(res.error);
    } catch (e) {
      // login() beklenmedik bir hata fırlatırsa buton sonsuza dek "yükleniyor"da
      // kalmasın; hatayı görünür kıl (sessiz takılma yerine).
      setError('Giriş sırasında hata: ' + (e?.message || 'bilinmeyen'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Ionicons name="calendar" size={40} color="#fff" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Ajanda Takip</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>Hesabınıza giriş yapın</Text>

        <View style={styles.form}>
          <TextField
            label="E-posta"
            colors={colors}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="ornek@mail.com"
          />
          <TextField
            label="Şifre"
            colors={colors}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••"
          />
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          <PrimaryButton title="Giriş Yap" onPress={onSubmit} loading={loading} colors={colors} />

          <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
            <Text style={{ color: colors.subtext }}>Hesabın yok mu? </Text>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Kayıt ol</Text>
          </Pressable>
        </View>

        <View style={[styles.demo, { borderColor: colors.border }]}>
          <Text style={[styles.demoText, { color: colors.subtext }]}>
            Demo admin: admin@admin.com / admin123
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 8 },
  logo: { width: 80, height: 80, borderRadius: 24, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 16 },
  form: { gap: 14 },
  error: { fontSize: 13, fontWeight: '600' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  demo: { marginTop: 28, borderWidth: 1, borderRadius: 10, borderStyle: 'dashed', padding: 10 },
  demoText: { fontSize: 12, textAlign: 'center' },
});
