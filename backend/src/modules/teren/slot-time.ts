export const FIELD_TIME_ZONE = "Europe/Bucharest";
const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: FIELD_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

function localAsUtc(timestamp: number): number {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map(({ type, value }) => [type, value]));
  const date = new Date(0);
  date.setUTCFullYear(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  date.setUTCHours(Number(parts.hour), Number(parts.minute), Number(parts.second), 0);
  return date.getTime();
}

/** Rezolvă o oră civilă; orele inexistente sau ambigue la schimbarea orei sunt refuzate. */
function resolveLocalTime(date: Date, minutes: number): Date | null {
  const target = date.getTime() + minutes * 60_000;
  const offsets = new Set([-86_400_000, 0, 86_400_000].map((shift) => {
    const sample = target + shift;
    return localAsUtc(sample) - sample;
  }));
  const matches = [...offsets].map((offset) => target - offset).filter((candidate) => localAsUtc(candidate) === target);
  return matches.length === 1 ? new Date(matches[0]) : null;
}

export function resolveSlotTimes(slot: { date: Date; startsAt: number; endsAt: number }) {
  const startsAtUtc = resolveLocalTime(slot.date, slot.startsAt);
  const endsAtUtc = resolveLocalTime(slot.date, slot.endsAt);
  return startsAtUtc && endsAtUtc && startsAtUtc < endsAtUtc ? { startsAtUtc, endsAtUtc } : null;
}
