// Yerel bildirim servisi (expo-notifications). İnternet GEREKTİRMEZ.
//
// HATIRLATICI STRATEJİSİ (hibrit — uygulama hiç açılmasa bile çalışsın diye):
//   1) Tek seferlik etkinlik        -> tek bir DATE bildirimi (sonraki occurrence).
//   2) Tekrarlayan + bitiş tarihi YOK -> OS'un native tekrarlayan trigger'ı
//      (DAILY/WEEKLY/MONTHLY). Uygulama bir daha hiç açılmasa bile sonsuza dek tetiklenir.
//   3) Tekrarlayan + bitiş tarihi VAR -> bitişe kadar somut DATE bildirim "penceresi"
//      (en çok MAX_SCHEDULED adet). Native tekrar bitiş tarihini ifade edemediği için,
//      bitişli serilerde fazladan tetiklememek adına occurrence'ları tek tek planlarız.
//
// Bir etkinlik birden çok bildirim planlayabildiğinden, planlanan id'ler events.notification_id
// (TEXT) içinde JSON dizi olarak saklanır. Eski tekil-id satırlarıyla geriye dönük uyumludur.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { expandRecurrences } from '../utils/recurrence';
import { parseLocal, endOfDay } from '../utils/dateUtils';
import * as eventsRepo from '../db/eventsRepo';

// Uygulama ön plandayken de bildirim görünsün (SDK 56 alanları).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHANNEL_ID = 'reminders';
const MAX_SCHEDULED = 30; // bitişli seride bir etkinlik için üst sınır
const T = Notifications.SchedulableTriggerInputTypes;

// Açılışta bir kez: Android kanalı + izin.
export async function setupNotifications() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Hatırlatıcılar',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563eb',
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    return status === 'granted';
  } catch (e) {
    console.warn('Bildirim kurulumu başarısız:', e);
    return false;
  }
}

// ---- Yardımcılar ----

function buildContent(event) {
  return {
    title: event.title || 'Hatırlatıcı',
    body: event.description || 'Yaklaşan etkinlik',
    data: { eventId: event.id },
  };
}

const androidChannel = Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {};

function dateTrigger(date) {
  return { type: T.DATE, date, ...androidChannel };
}

// Hatırlatıcı anının saat bileşenleri: başlangıç − offset. Bu bileşenler
// (haftalıkta weekday+saat, günlükte saat, aylıkta gün) tüm occurrence'larda aynıdır.
function reminderComponents(event) {
  if (event.reminder_offset_minutes == null) return null;
  const base = parseLocal(event.start_time);
  if (!base) return null;
  const remind = new Date(base.getTime() - Number(event.reminder_offset_minutes) * 60000);
  return {
    hour: remind.getHours(),
    minute: remind.getMinutes(),
    weekday: remind.getDay() + 1, // expo: 1=Pazar ... 7=Cumartesi
    day: remind.getDate(),
  };
}

function buildRepeatingTrigger(rule, c) {
  switch (rule) {
    case 'daily':
      return { type: T.DAILY, hour: c.hour, minute: c.minute, ...androidChannel };
    case 'weekly':
      return { type: T.WEEKLY, weekday: c.weekday, hour: c.hour, minute: c.minute, ...androidChannel };
    case 'monthly':
      return { type: T.MONTHLY, day: c.day, hour: c.hour, minute: c.minute, ...androidChannel };
    default:
      return null;
  }
}

// Tek seferlik etkinlik için bir sonraki hatırlatıcı zamanını bul.
function computeNextReminderDate(event) {
  if (event.reminder_offset_minutes == null) return null;
  const offsetMs = Number(event.reminder_offset_minutes) * 60000;
  const now = new Date();
  const horizon = new Date(now.getTime() + 365 * 24 * 3600 * 1000);
  const occurrences = expandRecurrences(event, now, horizon);
  for (const occ of occurrences) {
    const remindAt = new Date(occ.start.getTime() - offsetMs);
    if (remindAt > now) return remindAt;
  }
  return null;
}

// ---- Ana API ----

// Bir etkinlik için hatırlatıcı(lar)ı planla; planlanan bildirim id'lerini döndür.
export async function scheduleEventReminders(event) {
  try {
    if (event.reminder_offset_minutes == null) return [];
    const rule = event.recurrence_rule || 'none';

    // 1) Tek seferlik -> sonraki occurrence için tek DATE.
    if (rule === 'none') {
      const fireDate = computeNextReminderDate(event);
      if (!fireDate) return [];
      const id = await Notifications.scheduleNotificationAsync({
        content: buildContent(event),
        trigger: dateTrigger(fireDate),
      });
      return id ? [id] : [];
    }

    // 2) Tekrarlayan + bitiş YOK -> native tekrarlayan trigger (sonsuza dek).
    if (!event.recurrence_end_date) {
      const c = reminderComponents(event);
      const trigger = c && buildRepeatingTrigger(rule, c);
      if (!trigger) return [];
      const id = await Notifications.scheduleNotificationAsync({
        content: buildContent(event),
        trigger,
      });
      return id ? [id] : [];
    }

    // 3) Tekrarlayan + bitiş VAR -> bitişe kadar somut DATE penceresi.
    const offsetMs = Number(event.reminder_offset_minutes) * 60000;
    const now = new Date();
    const recEnd = endOfDay(parseLocal(event.recurrence_end_date));
    const occurrences = expandRecurrences(event, now, recEnd);
    const ids = [];
    for (const occ of occurrences) {
      const remindAt = new Date(occ.start.getTime() - offsetMs);
      if (remindAt <= now) continue;
      const id = await Notifications.scheduleNotificationAsync({
        content: buildContent(event),
        trigger: dateTrigger(remindAt),
      });
      if (id) ids.push(id);
      if (ids.length >= MAX_SCHEDULED) break;
    }
    return ids;
  } catch (e) {
    console.warn('Hatırlatıcı planlanamadı:', e);
    return [];
  }
}

// Bir etkinliğe ait planlanmış bildirim(ler)i iptal et.
// field: JSON id dizisi VEYA eski tekil id stringi olabilir.
export async function cancelEventReminders(field) {
  if (!field) return;
  let ids;
  try {
    const parsed = JSON.parse(field);
    ids = Array.isArray(parsed) ? parsed : [field];
  } catch {
    ids = [field]; // eski tekil id (JSON değil)
  }
  for (const id of ids) {
    if (!id) continue;
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      // zaten yoksa sorun değil
    }
  }
}

// Açılışta çağrılır: kullanıcının hatırlatıcılı etkinlikleri için bildirimleri
// yeniden planlar. Bitişli serilerde pencereyi tazeler; tek seferlik/native tekrar
// durumlarında da güvenli (iptal + yeniden planla). Böylece uygulama her açıldığında
// hatırlatıcılar güncel kalır.
export async function rescheduleUserReminders(userId) {
  try {
    const events = eventsRepo.listByUser(userId);
    for (const ev of events) {
      if (ev.reminder_offset_minutes == null) continue;
      await cancelEventReminders(ev.notification_id);
      const ids = await scheduleEventReminders(ev);
      eventsRepo.setNotificationId(ev.id, ids.length ? JSON.stringify(ids) : null);
    }
  } catch (e) {
    console.warn('Hatırlatıcılar yeniden planlanamadı:', e);
  }
}
