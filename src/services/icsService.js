// Etkinliği .ics (iCalendar) dosyası olarak dışa aktarıp telefonun native paylaşım
// menüsünü açar (mail, mesaj, takvim vb.). Tamamen offline: karşı taraf dosyayı
// kendi takvim uygulamasına ekler; bizim app ile bir bağlantısı olmaz.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { parseLocal, endOfDay } from '../utils/dateUtils';

const pad = (n) => String(n).padStart(2, '0');

// Date -> 'YYYYMMDDTHHMMSS' (TZ'siz "floating" yerel saat — en uyumlusu).
function icsDate(d) {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

// iCalendar metin kaçışları (virgül, noktalı virgül, ters bölü, yeni satır).
function esc(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

const FREQ = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY' };

export function buildIcs(event) {
  const start = parseLocal(event.start_time);
  const end = event.end_time ? parseLocal(event.end_time) : null;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ajanda Takip//TR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:ajanda-${event.id}-${icsDate(start)}@ajanda.takip`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
  ];
  if (end) lines.push(`DTEND:${icsDate(end)}`);
  lines.push(`SUMMARY:${esc(event.title || 'Etkinlik')}`);
  if (event.description) lines.push(`DESCRIPTION:${esc(event.description)}`);
  if (event.location) lines.push(`LOCATION:${esc(event.location)}`);

  if (FREQ[event.recurrence_rule]) {
    let rule = `RRULE:FREQ=${FREQ[event.recurrence_rule]}`;
    if (event.recurrence_end_date) {
      rule += `;UNTIL=${icsDate(endOfDay(parseLocal(event.recurrence_end_date)))}`;
    }
    lines.push(rule);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

// .ics dosyasını yazıp paylaşım menüsünü aç.
export async function shareEventAsIcs(event) {
  const ics = buildIcs(event);
  const safeName = String(event.title || 'etkinlik')
    .replace(/[^a-z0-9]+/gi, '-')
    .slice(0, 40) || 'etkinlik';
  const file = new File(Paths.document, `${safeName}.ics`);
  if (file.exists) file.delete();
  file.create();
  file.write(ics);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/calendar',
      dialogTitle: 'Etkinliği paylaş',
      UTI: 'public.calendar-event',
    });
  }
  return file.uri;
}
