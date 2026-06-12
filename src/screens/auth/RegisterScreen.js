import { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../utils/useTheme';
import { TextField, PrimaryButton } from '../../components/ui';

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={[styles.title, { color: colors.text }]}>Kayıt Ol</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>Yeni bir hesap oluşturun</Text>

        <View style={styles.form}>
          <TextField label="Ad Soyad" colors={colors} value={name} onChangeText={setName} placeholder="Adınız" />
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
            placeholder="En az 4 karakter"
          />
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          <PrimaryButton title="Kayıt Ol" onPress={onSubmit} loading={loading} colors={colors} />

          <Pressable onPress={() => navigation.goBack()} style={styles.linkRow}>
            <Text style={{ color: colors.subtext }}>Zaten hesabın var mı? </Text>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Giriş yap</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 8 },
  back: { position: 'absolute', top: 16, left: 16 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 16 },
  form: { gap: 14 },
  error: { fontSize: 13, fontWeight: '600' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
});
