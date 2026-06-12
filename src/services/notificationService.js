// Yerel bildirim servisi (expo-notifications). İnternet GEREKTİRMEZ.
// Hatırlatıcılar: etkinliğin bir sonraki occurrence'ının başlangıç saatinden
// reminder_offset_minutes çıkarılarak DATE trigger ile planlanır.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { expandRecurrences } from '../utils/recurrence';
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

// Etkinlik için planlanacak bir sonraki hatırlatıcı zamanını bul.
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

// Hatırlatıcıyı planla; planlanan bildirimin id'sini döndür (yoksa null).
export async function scheduleReminder(event) {
  try {
    const fireDate = computeNextReminderDate(event);
    if (!fireDate) return null;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: event.title || 'Hatırlatıcı',
        body: event.description || 'Yaklaşan etkinlik',
        data: { eventId: event.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
    });
    return id;
  } catch (e) {
    console.warn('Hatırlatıcı planlanamadı:', e);
    return null;
  }
}

// Planlanmış bir bildirimi iptal et.
export async function cancelReminder(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    // zaten yoksa sorun değil
  }
}

// Açılışta çağrılır: kullanıcının hatırlatıcılı etkinlikleri için bir sonraki
// occurrence'ın bildirimini yeniden planlar. Böylece tekrarlayan etkinliklerde
// bir bildirim düştükten sonra sonraki tekrar da güvence altına alınır
// (uygulama günlerce açılmasa bile her açılışta tazelenir).
export async function rescheduleUserReminders(userId) {
  try {
    const events = eventsRepo.listByUser(userId);
    for (const ev of events) {
      if (ev.reminder_offset_minutes == null) continue;
      await cancelReminder(ev.notification_id);
      const notifId = await scheduleReminder(ev);
      eventsRepo.setNotificationId(ev.id, notifId || null);
    }
  } catch (e) {
    console.warn('Hatırlatıcılar yeniden planlanamadı:', e);
  }
}
