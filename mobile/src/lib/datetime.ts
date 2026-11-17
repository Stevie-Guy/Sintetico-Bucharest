/**
 * Date și ore pentru ecrane. Terenurile sunt în București, deci orele se afișează mereu în
 * fusul `Europe/Bucharest`, indiferent de fusul telefonului.
 *
 * Backend-ul folosește două formate:
 *  - zile calendaristice `AAAA-LL-ZZ` și ore locale `HH:mm` (program, intervale, rezervări);
 *  - momente exacte în ISO UTC (`startsAtUtc`, `startsAt` la meciuri).
 */

export const FIELD_TIME_ZONE = "Europe/Bucharest";

const WEEKDAYS = ["duminică", "luni", "marți", "miercuri", "joi", "vineri", "sâmbătă"];
const WEEKDAYS_SHORT = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
const MONTHS = ["ian.", "feb.", "mar.", "apr.", "mai", "iun.", "iul.", "aug.", "sept.", "oct.", "nov.", "dec."];

/** Părțile (an, lună, zi, oră, minut) ale unui moment, văzute în București. */
function bucharestParts(date: Date) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: FIELD_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
  } catch {
    // Fără suport Intl pentru fusuri orare: folosim fusul telefonului (în România e același).
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }
}

const pad = (n: number) => n.toString().padStart(2, "0");

/** Ziua de azi în București, ca `AAAA-LL-ZZ`. */
export function todayIso(): string {
  const p = bucharestParts(new Date());
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** `AAAA-LL-ZZ` + n zile. */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Următoarele `count` zile, începând cu azi. */
export function nextDays(count: number): string[] {
  const today = todayIso();
  return Array.from({ length: count }, (_, i) => addDays(today, i));
}

/** „joi, 20 nov. 2026” */
export function formatDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return `${WEEKDAYS[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Etichetă scurtă pentru selectorul de zile: „Joi 20”. */
export function formatDayShort(isoDate: string): { weekday: string; day: string } {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return { weekday: WEEKDAYS_SHORT[date.getUTCDay()], day: `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}` };
}

/** Părțile unei zile pentru blocul de dată din carduri: „Joi” / „20” / „nov.”. */
export function dateParts(isoDate: string): { weekday: string; day: string; month: string } {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return {
    weekday: WEEKDAYS_SHORT[date.getUTCDay()],
    day: String(date.getUTCDate()),
    month: MONTHS[date.getUTCMonth()],
  };
}

/** „Azi”, „Mâine” sau ziua scurtă („Joi, 20 nov.”). */
export function relativeDay(isoDate: string): string {
  const today = todayIso();
  if (isoDate === today) return "Azi";
  if (isoDate === addDays(today, 1)) return "Mâine";
  const { weekday, day } = formatDayShort(isoDate);
  return `${weekday}, ${day}`;
}

/** Ora unui moment ISO, în București: „18:30”. */
export function formatTime(iso: string): string {
  const p = bucharestParts(new Date(iso));
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Ziua (`AAAA-LL-ZZ`) unui moment ISO, în București. */
export function dayOf(iso: string): string {
  const p = bucharestParts(new Date(iso));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** „joi, 20 nov. 2026, 18:30” */
export function formatDateTime(iso: string): string {
  return `${formatDay(dayOf(iso))}, ${formatTime(iso)}`;
}

/** Validare simplă pentru `HH:mm` (00:00–23:59; `allow24` acceptă și 24:00, pentru sfârșit de zi). */
export function isValidTime(value: string, allow24 = false): boolean {
  if (allow24 && value === "24:00") return true;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Validare pentru `AAAA-LL-ZZ` (inclusiv că ziua există în calendar). */
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
