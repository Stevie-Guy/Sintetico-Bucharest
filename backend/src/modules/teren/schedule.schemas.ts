import { z } from "zod";

const startTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ora trebuie să fie în formatul HH:mm (00:00–23:59).");
const endTime = z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/, "Ora trebuie să fie în formatul HH:mm (00:00–24:00).");
const calendarDate = z.iso.date({ error: "Data trebuie să fie validă, în formatul AAAA-LL-ZZ." })
  .refine((value) => !value.startsWith("0000-"), "Anul trebuie să fie între 0001 și 9999.");

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatTime(minutes: number): string {
  return `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
}

export const operatingHoursSchema = z.strictObject({ opensAt: startTime, closesAt: endTime })
  .refine((value) => toMinutes(value.opensAt) < toMinutes(value.closesAt), {
    path: ["closesAt"], error: "Ora închiderii trebuie să fie după ora deschiderii, în aceeași zi.",
  });

export const availabilitySchema = z.strictObject({
  date: calendarDate,
  startsAt: startTime,
  endsAt: endTime,
}).refine((value) => toMinutes(value.startsAt) < toMinutes(value.endsAt), {
  path: ["endsAt"], error: "Sfârșitul intervalului trebuie să fie după început, în aceeași zi.",
});

export const fieldParamsSchema = z.object({ id: z.uuid() });
export const intervalParamsSchema = fieldParamsSchema.extend({ intervalId: z.uuid() });
export const availabilityQuerySchema = z.strictObject({ date: calendarDate });

export type OperatingHoursInput = z.infer<typeof operatingHoursSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
