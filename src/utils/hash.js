// Şifre hash'leme — expo-crypto SHA-256.
// Şifreler veritabanına asla düz metin olarak yazılmaz; her zaman bu fonksiyonun
// çıktısı (hex string) saklanır. Tamamen offline çalışır.

import * as Crypto from 'expo-crypto';

export async function hashPassword(plain) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    String(plain)
  );
}
