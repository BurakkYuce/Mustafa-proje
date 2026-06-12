// Paylaşılan küçük UI parçaları.
import {
  Pressable, Text, TextInput, View, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../utils/useTheme';

export function TextField({ label, colors, style, ...props }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={[s.label, { color: colors.subtext }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.subtext}
        style={[
          s.input,
          { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

export function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary', colors, icon }) {
  const isGhost = variant === 'ghost';
  const bg = variant === 'danger' ? colors.danger : isGhost ? 'transparent' : colors.primary;
  const fg = isGhost ? colors.primary : '#ffffff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        s.btn,
        {
          backgroundColor: bg,
          borderColor: colors.primary,
          borderWidth: isGhost ? 1.5 : 0,
          opacity: disabled || loading ? 0.6 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={s.btnInner}>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={[s.btnText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

// Header sağ üst çıkış butonu (navigator options'larında kullanılır).
export function HeaderLogout() {
  const logout = useAuthStore((st) => st.logout);
  const { colors } = useTheme();
  return (
    <Pressable onPress={logout} hitSlop={12} style={{ marginRight: 6 }}>
      <Ionicons name="log-out-outline" size={23} color={colors.primary} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { fontSize: 16, fontWeight: '700' },
});
