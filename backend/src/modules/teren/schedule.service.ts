import type { FieldAvailability, FieldOperatingHours, Prisma } from "../../generated/prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import { formatTime, toMinutes, type AvailabilityInput, type OperatingHoursInput } from "./schedule.schemas";

import { lockOwnedField } from "./field-lock";
import { FIELD_TIME_ZONE, resolveSlotTimes } from "./slot-time";

function presentHours(hours: FieldOperatingHours) {
  return { fieldId: hours.fieldId, opensAt: formatTime(hours.opensAt), closesAt: formatTime(hours.closesAt), timeZone: FIELD_TIME_ZONE };
}

function presentInterval(interval: FieldAvailability) {
  return {
    id: interval.id, version: interval.version, fieldId: interval.fieldId, date: interval.date.toISOString().slice(0, 10),
    startsAt: formatTime(interval.startsAt), endsAt: formatTime(interval.endsAt), timeZone: FIELD_TIME_ZONE,
  };
}

async function requireField(fieldId: string) {
  const field = await prisma.teren.findUnique({ where: { id: fieldId }, select: { id: true } });
  if (!field) throw new AppError(404, "FIELD_NOT_FOUND", "Terenul nu există.");
}

export async function getOperatingHours(fieldId: string) {
  await requireField(fieldId);
  const hours = await prisma.fieldOperatingHours.findUnique({ where: { fieldId } });
  return hours ? presentHours(hours) : null;
}

export async function setOperatingHours(fieldId: string, userId: string, input: OperatingHoursInput) {
  return prisma.$transaction(async (tx) => {
    await lockOwnedField(tx, fieldId, userId);
    const opensAt = toMinutes(input.opensAt);
    const closesAt = toMinutes(input.closesAt);
    const conflict = await tx.fieldAvailability.findFirst({ where: {
      fieldId, OR: [{ startsAt: { lt: opensAt } }, { endsAt: { gt: closesAt } }],
    } });
    if (conflict) {
      throw new AppError(409, "HOURS_CONFLICT", "Există intervale în afara noului program. Modifică sau șterge intervalele înainte de schimbarea programului.");
    }
    const hours = await tx.fieldOperatingHours.upsert({
      where: { fieldId }, create: { fieldId, opensAt, closesAt }, update: { opensAt, closesAt },
    });
    return presentHours(hours);
  });
}

export async function deleteOperatingHours(fieldId: string, userId: string) {
  await prisma.$transaction(async (tx) => {
    await lockOwnedField(tx, fieldId, userId);
    if (await tx.fieldAvailability.findFirst({ where: { fieldId }, select: { id: true } })) {
      throw new AppError(409, "HOURS_CONFLICT", "Șterge intervalele disponibile înainte de ștergerea programului.");
    }
    await tx.fieldOperatingHours.deleteMany({ where: { fieldId } });
  });
}

export async function listAvailability(fieldId: string, date: string) {
  await requireField(fieldId);
  const intervals = await prisma.fieldAvailability.findMany({
    where: { fieldId, date: new Date(`${date}T00:00:00.000Z`),
      reservations: { none: { status: { in: ["PENDING", "APPROVED"] } } },
    }, orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    include: { field: { select: { operatingHours: true } } },
  });
  const now = new Date();
  return intervals.flatMap((interval) => {
    const hours = interval.field.operatingHours;
    const times = resolveSlotTimes(interval);
    if (!hours || interval.startsAt < hours.opensAt || interval.endsAt > hours.closesAt || !times || times.startsAtUtc <= now) return [];
    return [{ ...presentInterval(interval), ...times }];
  });
}

export async function saveAvailability(fieldId: string, userId: string, input: AvailabilityInput, intervalId?: string) {
  return prisma.$transaction(async (tx) => {
    await lockOwnedField(tx, fieldId, userId);
    if (intervalId && !await tx.fieldAvailability.findFirst({ where: { id: intervalId, fieldId } })) {
      throw new AppError(404, "INTERVAL_NOT_FOUND", "Intervalul nu există pentru acest teren.");
    }
    if (intervalId) await requireUnreservedInterval(tx, fieldId, intervalId);
    const hours = await tx.fieldOperatingHours.findUnique({ where: { fieldId } });
    if (!hours) throw new AppError(409, "HOURS_NOT_SET", "Configurează programul terenului înainte de adăugarea intervalelor.");
    const startsAt = toMinutes(input.startsAt);
    const endsAt = toMinutes(input.endsAt);
    if (startsAt < hours.opensAt || endsAt > hours.closesAt) {
      throw new AppError(400, "OUTSIDE_OPERATING_HOURS",
        `Intervalul trebuie să fie în programul ${formatTime(hours.opensAt)}–${formatTime(hours.closesAt)}. Introdu un interval valid sau modifică programul de funcționare.`,
        { startsAt: ["Verifică încadrarea intervalului în program."], endsAt: ["Verifică încadrarea intervalului în program."] });
    }
    const date = new Date(`${input.date}T00:00:00.000Z`);
    const overlap = await tx.fieldAvailability.findFirst({ where: {
      fieldId, date, ...(intervalId ? { id: { not: intervalId } } : {}),
      startsAt: { lt: endsAt }, endsAt: { gt: startsAt },
    } });
    if (overlap) throw new AppError(409, "INTERVAL_OVERLAP", "Intervalul se suprapune cu un interval disponibil existent.");
    const data = { fieldId, date, startsAt, endsAt };
    const interval = intervalId
      ? await tx.fieldAvailability.update({ where: { id: intervalId }, data: { ...data, version: { increment: 1 } } })
      : await tx.fieldAvailability.create({ data });
    return presentInterval(interval);
  });
}

export async function deleteAvailability(fieldId: string, userId: string, intervalId: string) {
  await prisma.$transaction(async (tx) => {
    await lockOwnedField(tx, fieldId, userId);
    await requireUnreservedInterval(tx, fieldId, intervalId);
    const result = await tx.fieldAvailability.deleteMany({ where: { id: intervalId, fieldId } });
    if (!result.count) throw new AppError(404, "INTERVAL_NOT_FOUND", "Intervalul nu există pentru acest teren.");
  });
}


async function requireUnreservedInterval(tx: Prisma.TransactionClient, fieldId: string, intervalId: string) {
  const active = await tx.reservation.findFirst({ where: { fieldId, availabilityId: intervalId, status: { in: ["PENDING", "APPROVED"] } }, select: { id: true } });
  if (active) throw new AppError(409, "INTERVAL_HAS_RESERVATION", "Un interval cu rezervare în așteptare sau aprobată nu poate fi modificat sau șters.");
}
