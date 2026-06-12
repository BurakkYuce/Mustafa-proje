// Tekrarlayan etkinlik motoru — RULE-BASED yaklaşım.
//
// TASARIM KARARI (rapora): events tablosunda her etkinlik TEK satır olarak durur.
// Takvimde gösterirken, görünür tarih aralığı için occurrence'lar (tekrar örnekleri)
// burada RUNTIME'da hesaplanır; veritabanına hiçbir occurrence yazılmaz.
// Bu sayede veri tekrarı/depolama maliyeti olmaz, "sonsuz tekrar" doğal desteklenir,
// seri tek satırdan güncellenir (normalizasyon/3NF ile uyumlu).
// Doğal sonucu: düzenle/sil tüm seriyi etkiler; "sadece bu occurrence'ı değiştir"
// ayrı bir istisna (exception) tablosu gerektirir ve bu projenin kapsamı dışındadır.

import { parseLocal, addDays, addWeeks, addMonths, endOfDay } from './dateUtils';

const MAX_OCCURRENCES = 1000; // sonsuz döngü güvenliği

function stepNext(date, rule) {
  switch (rule) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    default:
      return null;
  }
}

/**
 * Bir etkinliği verilen [rangeStart, rangeEnd] aralığı için occurrence'lara genişletir.
 * @param {object} event - DB satırı (start_time, end_time, recurrence_rule, recurrence_end_date...)
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {Array<{event, start: Date, end: Date|null, key: string}>}
 */
export function expandRecurrences(event, rangeStart, rangeEnd) {
  const baseStart = parseLocal(event.start_time);
  if (!baseStart) return [];

  const baseEnd = event.end_time ? parseLocal(event.end_time) : null;
  const durationMs = baseEnd ? baseEnd.getTime() - baseStart.getTime() : 0;

  const rule = event.recurrence_rule || 'none';

  // Tekrar bitiş tarihi (date-only ise o günün sonu)
  const recEnd = event.recurrence_end_date
    ? endOfDay(parseLocal(event.recurrence_end_date))
    : null;

  const results = [];

  const pushOccurrence = (occStart) => {
    const occEnd = durationMs ? new Date(occStart.getTime() + durationMs) : null;
    results.push({
      event,
      start: occStart,
      end: occEnd,
      key: `${event.id}-${occStart.getFullYear()}-${occStart.getMonth() + 1}-${occStart.getDate()}-${occStart.getHours()}${occStart.getMinutes()}`,
    });
  };

  if (rule === 'none') {
    if (baseStart >= rangeStart && baseStart <= rangeEnd) {
      pushOccurrence(baseStart);
    }
    return results;
  }

  let occ = new Date(baseStart);
  let count = 0;
  while (count < MAX_OCCURRENCES) {
    count += 1;
    if (occ > rangeEnd) break;
    if (recEnd && occ > recEnd) break;
    if (occ >= rangeStart) {
      pushOccurrence(new Date(occ));
    }
    const next = stepNext(occ, rule);
    if (!next) break;
    occ = next;
  }

  return results;
}

/**
 * Birden çok etkinliği genişletip başlangıç saatine göre sıralı tek liste döndürür.
 */
export function expandMany(events, rangeStart, rangeEnd) {
  const all = [];
  for (const ev of events) {
    all.push(...expandRecurrences(ev, rangeStart, rangeEnd));
  }
  all.sort((a, b) => a.start - b.start);
  return all;
}
