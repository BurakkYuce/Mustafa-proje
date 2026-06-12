# Ajanda Takip Sistemi

React Native (Expo, **saf JavaScript**) ile geliştirilmiş, **tamamen offline** çalışan
ajanda / etkinlik takip uygulaması. Veriler cihazdaki **SQLite** veritabanında tutulur;
hiçbir internet/cloud bağımlılığı yoktur (sunumda bağlantı riski olmasın diye).

> Bitirme projesi. Açık kaynak veritabanı (SQLite) + zorunlu **yönetici (admin) paneli** içerir.

## Özellikler

### Kullanıcı
- E-posta + şifre ile **kayıt / giriş** (şifreler `expo-crypto` SHA-256 ile hash'lenir)
- **Gün / Hafta / Ay** takvim görünümleri + saatlik **timeline**
  - Saate **dokunarak** veya "Sürükle" modunu açıp **sürükleyerek** etkinlik oluşturma
- Etkinlik **ekleme / düzenleme / silme**: başlık, açıklama, başlangıç–bitiş, kategori,
  tekrar (yok/günlük/haftalık/aylık + bitiş tarihi), hatırlatıcı
- **Tekrarlayan etkinlikler** (occurrence'lar runtime hesaplanır — bkz. _Mimari_)
- **Renkli kategoriler** + takvimde kategoriye göre filtreleme
- **Yerel bildirimler** (`expo-notifications`): hatırlatıcı süresine göre planlanır,
  etkinlik güncellenince/silinince iptal edilip yeniden planlanır
- **Karanlık mod** (kalıcı)

### Admin (`role = 'admin'` ile giriş yapınca açılır)
- **Panel**: toplam kullanıcı / etkinlik sayısı + kategori bazında dağılım (bar chart)
- **Kullanıcı listesi**
- **JSON yedekleme**: tüm tabloları dışa aktar (paylaş/kaydet) ve bir JSON'dan geri yükle

## Demo giriş
| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | `admin@admin.com` | `admin123` |

Admin hesabı, veritabanı ilk kurulduğunda otomatik oluşturulur (seed).

## Teknolojiler
- Expo SDK 56 · React Native 0.85 · React 19 (JavaScript)
- `expo-sqlite` (SQLite) · `expo-crypto` · `expo-notifications` · `expo-file-system` · `expo-sharing` · `expo-document-picker`
- `zustand` (state) · `@react-navigation` (native-stack + bottom-tabs)
- `react-native-calendars` · `@react-native-community/datetimepicker` · `@expo/vector-icons`

## Kurulum & Çalıştırma
Gerçek Android cihazda **development build** ile çalışır (yerel bildirimler için gerekli).

```bash
npm install

# Geliştirme (cihaz USB ile bağlı veya emülatör açık olmalı):
npx expo run:android

# Sunum için tek dosya APK (offline, Metro gerektirmez):
npx expo run:android --variant release
# veya:  eas build -p android --profile preview --local
```

> Not: Expo Go ile de açılabilir ama yeni SDK'larda zamanlanmış bildirimlerde
> kısıtlamalar olabileceği için **dev build / APK** önerilir.

## Proje Yapısı
```
App.js                 Kök: DB init, oturum/ayar yükleme, tema, NavigationContainer
src/
  db/                  SQLite init + migration + seed + repo'lar (users/categories/events)
  store/               Zustand: auth, events, categories, settings
  navigation/          Root (role-based), Auth, UserTabs, AdminTabs
  screens/auth         Login, Register
  screens/user         Calendar, EventForm, Categories, Settings
  screens/admin        Dashboard, UserList, BackupRestore
  components/          DayTimeline, EventCard, CategoryPill, ColorPicker, BarChart, ...
  services/            notificationService, backupService
  utils/               recurrence, dateUtils, hash, theme
```

## Veritabanı Şeması
`users`, `categories`, `events` (FK ilişkili). Tam şema: `src/db/index.js`.

## Mimari Notu — Tekrarlayan Etkinlikler (tasarım kararı)
Tekrarlar **rule-based** modellenir: `events` tablosunda her etkinlik **tek satır**dır.
Takvimde gösterilirken, görünür tarih aralığı için occurrence'lar
`src/utils/recurrence.js` içinde **runtime** hesaplanır; veritabanına occurrence yazılmaz.

**Neden:** Veri tekrarını/depolama maliyetini ortadan kaldırır, "sonsuz tekrar"ı doğal
destekler, seri tek satırdan güncellenir (normalizasyon / 3NF).

**Doğal sonuç:** Düzenleme/silme **tüm seriyi** etkiler. "Sadece bu occurrence'ı değiştir"
özelliği ayrı bir istisna (exception) tablosu + occurrence kimliklendirme gerektirir
(krş. iCalendar RFC 5545 `EXDATE` / `RECURRENCE-ID`) ve bu offline, sunum odaklı projenin
kapsamı dışında **bilinçli olarak** bırakılmıştır. Gerektiğinde `event_exceptions` tablosu
eklenerek genişletilebilir.
