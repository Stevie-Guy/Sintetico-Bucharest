import { Prisma, type Reservation } from "../../generated/prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import { lockField, lockOwnedField } from "../teren/field-lock";
import { formatTime } from "../teren/schedule.schemas";
import { FIELD_TIME_ZONE, resolveSlotTimes } from "../teren/slot-time";
import type { CreateReservationInput, ReservationDecision, ReservationQuery } from "./reservation.schemas";

export const ACTIVE_RESERVATION_STATUSES = ["PENDING", "APPROVED"] as const;

export function presentReservation(reservation: Reservation) {
  return { ...reservation, date: reservation.date.toISOString().slice(0, 10),
    startsAt: formatTime(reservation.startsAt), endsAt: formatTime(reservation.endsAt), timeZone: FIELD_TIME_ZONE };
}

export async function createReservation(fieldId: string, playerId: string, input: CreateReservationInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const field = await lockField(tx, fieldId);
      const slot = await tx.fieldAvailability.findFirst({ where: { id: input.availabilityId, fieldId } });
      if (!slot) throw new AppError(404, "INTERVAL_NOT_FOUND", "Intervalul nu există pentru acest teren.");
      if (slot.version !== input.expectedVersion) {
        throw new AppError(409, "INTERVAL_CHANGED", "Intervalul a fost modificat. Reîncarcă lista și alege din nou.");
      }
      const hours = await tx.fieldOperatingHours.findUnique({ where: { fieldId } });
      if (!hours || slot.startsAt < hours.opensAt || slot.endsAt > hours.closesAt) {
        throw new AppError(409, "INTERVAL_UNAVAILABLE", "Intervalul nu mai este disponibil în programul terenului.");
      }
      const times = resolveSlotTimes(slot);
      if (!times) throw new AppError(400, "INVALID_LOCAL_TIME", "Intervalul conține ore ambigue sau inexistente la schimbarea orei.");
      if (times.startsAtUtc <= new Date()) throw new AppError(409, "INTERVAL_STARTED", "Nu poți rezerva un interval care a început deja.");
      const occupied = await tx.reservation.findFirst({ where: {
        fieldId, date: slot.date, status: { in: [...ACTIVE_RESERVATION_STATUSES] },
        startsAt: { lt: slot.endsAt }, endsAt: { gt: slot.startsAt },
      } });
      if (occupied) throw new AppError(409, "INTERVAL_RESERVED", "Intervalul este deja rezervat sau așteaptă aprobarea administratorului.");
      const reservation = await tx.reservation.create({ data: {
        fieldId, playerId, availabilityId: slot.id, date: slot.date, startsAt: slot.startsAt, endsAt: slot.endsAt, ...times,
      } });
      // Rezervarea și notificarea se salvează împreună: niciuna nu poate lipsi la succes.
      await tx.notification.create({ data: {
        recipientId: field.adminId, reservationId: reservation.id, type: "RESERVATION_REQUESTED",
        message: `Cerere nouă de rezervare: ${slot.date.toISOString().slice(0, 10)}, ${formatTime(slot.startsAt)}–${formatTime(slot.endsAt)}. Este necesară aprobarea ta.`,
      } });
      return presentReservation(reservation);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "INTERVAL_RESERVED", "Intervalul este deja rezervat sau așteaptă aprobarea administratorului.");
    }
    throw error;
  }
}

export async function decideReservation(fieldId: string, ownerId: string, reservationId: string, status: ReservationDecision) {
  return prisma.$transaction(async (tx) => {
    await lockOwnedField(tx, fieldId, ownerId);
    const reservation = await tx.reservation.findFirst({ where: { id: reservationId, fieldId } });
    if (!reservation) throw new AppError(404, "RESERVATION_NOT_FOUND", "Rezervarea nu există pentru acest teren.");
    // Retry-ul aceleiași decizii este idempotent și nu trimite notificări duplicate.
    if (reservation.status === status) return presentReservation(reservation);
    if (reservation.status !== "PENDING") throw new AppError(409, "RESERVATION_ALREADY_DECIDED", "Rezervarea are deja o decizie finală.");
    if (status === "APPROVED" && reservation.startsAtUtc <= new Date()) {
      throw new AppError(409, "INTERVAL_STARTED", "Nu poți aproba o rezervare după începerea intervalului.");
    }
    const updated = await tx.reservation.update({ where: { id: reservationId }, data: { status, decidedAt: new Date() } });
    await tx.notification.create({ data: {
      reservationId, recipientId: reservation.playerId,
      type: status === "APPROVED" ? "RESERVATION_APPROVED" : "RESERVATION_REJECTED",
      message: `Rezervarea din ${reservation.date.toISOString().slice(0, 10)}, ${formatTime(reservation.startsAt)}–${formatTime(reservation.endsAt)} a fost ${status === "APPROVED" ? "aprobată" : "respinsă"}.`,
    } });
    return presentReservation(updated);
  });
}

async function listReservations(where: Prisma.ReservationWhereInput, query: ReservationQuery) {
  const { page, pageSize, status, date } = query;
  const records = await prisma.reservation.findMany({
    where: { ...where, status, ...(date ? { date: new Date(`${date}T00:00:00.000Z`) } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize + 1,
    include: { field: { select: { id: true, nume: true, adresa: true } }, player: { select: { id: true, name: true } } },
  });
  return { reservations: records.slice(0, pageSize).map(presentReservation), page, pageSize, hasMore: records.length > pageSize };
}

export function listMyReservations(playerId: string, query: ReservationQuery) {
  return listReservations({ playerId }, query);
}

export async function listFieldReservations(fieldId: string, ownerId: string, query: ReservationQuery) {
  const field = await prisma.teren.findUnique({ where: { id: fieldId }, select: { adminId: true } });
  if (!field) throw new AppError(404, "FIELD_NOT_FOUND", "Terenul nu există.");
  if (field.adminId !== ownerId) throw new AppError(403, "FIELD_NOT_OWNED", "Poți vedea doar rezervările terenurilor proprii.");
  return listReservations({ fieldId }, query);
}
