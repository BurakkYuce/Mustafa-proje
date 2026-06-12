// Kimlik doğrulama store'u. Şifreler expo-crypto ile hash'lenir.
// Oturum (userId) AsyncStorage'da tutulur, açılışta geri yüklenir.
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as usersRepo from '../db/usersRepo';
import { hashPassword } from '../utils/hash';

const SESSION_KEY = 'session.userId';

// Hassas alanı (password) UI state'ine taşımadan ayıkla.
function sanitize(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at };
}

export const useAuthStore = create((set) => ({
  currentUser: null,
  loading: true,

  restoreSession: async () => {
    try {
      const id = await AsyncStorage.getItem(SESSION_KEY);
      if (id) {
        const u = usersRepo.getUserById(Number(id));
        if (u) set({ currentUser: sanitize(u) });
      }
    } catch (e) {
      // yoksay
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const e = String(email).trim().toLowerCase();
    if (!e || !password) return { ok: false, error: 'E-posta ve şifre gerekli' };
    const user = usersRepo.findByEmail(e);
    if (!user) return { ok: false, error: 'Kullanıcı bulunamadı' };
    const hashed = await hashPassword(password);
    if (user.password !== hashed) return { ok: false, error: 'Şifre hatalı' };
    await AsyncStorage.setItem(SESSION_KEY, String(user.id));
    set({ currentUser: sanitize(user) });
    return { ok: true };
  },

  register: async (name, email, password) => {
    const n = String(name).trim();
    const e = String(email).trim().toLowerCase();
    if (!n || !e || !password) return { ok: false, error: 'Tüm alanları doldurun' };
    if (password.length < 4) return { ok: false, error: 'Şifre en az 4 karakter olmalı' };
    if (usersRepo.findByEmail(e)) return { ok: false, error: 'Bu e-posta zaten kayıtlı' };
    const hashed = await hashPassword(password);
    const id = usersRepo.createUser({ name: n, email: e, password: hashed, role: 'user' });
    await AsyncStorage.setItem(SESSION_KEY, String(id));
    set({ currentUser: { id, name: n, email: e, role: 'user' } });
    return { ok: true };
  },

  logout: async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    set({ currentUser: null });
  },
}));
