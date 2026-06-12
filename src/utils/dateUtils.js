// Tarih yardımcıları.
// Saklama formatı: 'YYYY-MM-DDTHH:mm:ss' (YEREL saat, timezone eki YOK).
// Tüm parse işlemleri yerel saat olarak yorumlanır (motorlar arası tutarlılık için
// new Date(str) yerine elle parçalayıp new Date(y, m, d, ...) kullanıyoruz).

const pad = (n) => String(n).padStart(2, '0');

// Date -> 'YYYY-MM-DDTHH:mm:ss'
export function formatLocal(date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

// 'YYYY-MM-DD...' veya 'YYYY-MM-DDTHH:mm:ss' -> Date (yerel)
export function parseLocal(str) {
  if (!str) return null;
  const [datePart, timePart = '00:00:00'] = String(str).replace(' ', 'T').split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh = 0, mm = 0, ss = 0] = timePart.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh, mm, ss);
}

// Date -> 'YYYY-MM-DD' (react-native-calendars anahtarı)
export function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function addWeeks(date, n) {
  return addDays(date, n * 7);
}

// Ay eklerken gün taşmasını kırp (örn. 31 Ocak + 1 ay = 28/29 Şubat)
export function addMonths(date, n) {
  const d = new Date(date);
  const targetDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(targetDay, lastDay));
  return d;
}

// Görüntüleme yardımcıları
export function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function formatDate(date) {
  return `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}`;
}

// İki tarih aynı gün mü?
export function isSameDay(a, b) {
  return dateKey(a) === dateKey(b);
}
