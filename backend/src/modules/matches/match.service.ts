import { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import { lockField } from "../teren/field-lock";
import { FIELD_TIME_ZONE } from "../teren/slot-time";
import { requireMatchingAge, validateMatchTime } from "./match.rules";
import type { CreateMatchInput, MatchPagination } from "./match.schemas";

const fieldFields = { id: true, nume: true, adresa: true, sector: true, numarJucatori: true } satisfies Prisma.TerenSelect;
const matchFields = {
  id: true, startsAt: true, endsAt: true, maxPlayers: true, ageCategory: true, createdAt: true,
  creator: { select: { id: true, name: true } },
  reservation: { select: { field: { select: fieldFields } } },
  _count: { select: { participants: true } },
} satisfies Prisma.MatchSelect;
type MatchRecord = Prisma.MatchGetPayload<{ select: typeof matchFields }>;

function presentMatch({ reservation, _count, ...match }: MatchRecord) {
  return { ...match, field: reservation.field, timeZone: FIELD_TIME_ZONE,
    participantCount: _count.participants, availablePlaces: match.maxPlayers - _count.participants,
    isFull: _count.participants >= match.maxPlayers };
}

/** Selectorul pentru creare: doar rezervările proprii, aprobate, nefolosite și încă valabile. */
export async function listEligibleReservations(playerId: string, { page, pageSize }: MatchPagination) {
  const records = await prisma.reservation.findMany({
    where: { playerId, status: "APPROVED", endsAtUtc: { gt: new Date() }, match: { is: null } },
    select: { id: true, startsAtUtc: true, endsAtUtc: true, field: { select: fieldFields } },
    orderBy: [{ startsAtUtc: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize + 1,
  });
  return { reservations: records.slice(0, pageSize), page, pageSize, hasMore: records.length > pageSize };
}

export async function createMatch(playerId: string, input: CreateMatchInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const reference = await tx.reservation.findUnique({ where: { id: input.reservationId }, select: { fieldId: true } });
      if (!reference) throw new AppError(404, "RESERVATION_NOT_FOUND", "Rezervarea nu există.");
      // Același protocol ca aprobarea rezervării și modificarea programului terenului.
      await lockField(tx, reference.fieldId);
      const reservation = await tx.reservation.findUnique({ where: { id: input.reservationId }, include: { match: true, field: true } });
      if (!reservation) throw new AppError(404, "RESERVATION_NOT_FOUND", "Rezervarea nu există.");
      if (reservation.playerId !== playerId) throw new AppError(403, "RESERVATION_NOT_OWNED", "Poți crea un meci numai cu o rezervare proprie.");
      if (reservation.status !== "APPROVED") throw new AppError(409, "RESERVATION_NOT_APPROVED", "Rezervarea trebuie aprobată de administratorul terenului.");
      if (reservation.match) throw new AppError(409, "RESERVATION_ALREADY_USED", "Rezervarea este deja folosită pentru un meci.");
      validateMatchTime(input.startsAt, reservation);
      const match = await tx.match.create({
        data: { ...input, creatorId: playerId, endsAt: reservation.endsAtUtc }, select: matchFields,
      });
      const warnings = input.maxPlayers === reservation.field.numarJucatori ? [] : [{
        code: "RECOMMENDED_PLAYERS_DIFFERENT",
        message: `Terenul recomandă ${reservation.field.numarJucatori} jucători; limita aleasă este ${input.maxPlayers}.`,
      }];
      return { match: presentMatch(match), warnings };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "RESERVATION_ALREADY_USED", "Rezervarea este deja folosită pentru un meci.");
    }
    throw error;
  }
}

export async function listMatches({ page, pageSize }: MatchPagination) {
  const records = await prisma.match.findMany({
    where: { startsAt: { gt: new Date() } }, select: matchFields,
    orderBy: [{ startsAt: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize + 1,
  });
  return { matches: records.slice(0, pageSize).map(presentMatch), page, pageSize, hasMore: records.length > pageSize };
}

export async function getMatch(id: string) {
  const match = await prisma.match.findUnique({ where: { id }, select: matchFields });
  if (!match) throw new AppError(404, "MATCH_NOT_FOUND", "Meciul nu există.");
  return presentMatch(match);
}

export async function listParticipants(matchId: string, { page, pageSize }: MatchPagination) {
  if (!await prisma.match.findUnique({ where: { id: matchId }, select: { id: true } })) {
    throw new AppError(404, "MATCH_NOT_FOUND", "Meciul nu există.");
  }
  const participants = await prisma.matchParticipant.findMany({
    where: { matchId }, select: { joinedAt: true, user: { select: { id: true, name: true } } },
    orderBy: [{ joinedAt: "asc" }, { userId: "asc" }], skip: (page - 1) * pageSize, take: pageSize + 1,
  });
  return { participants: participants.slice(0, pageSize), page, pageSize, hasMore: participants.length > pageSize };
}

export async function joinMatch(userId: string, matchId: string) {
  return prisma.$transaction(async (tx) => {
    // Numărarea și inserarea se execută sub aceeași blocare: ultimul loc nu se poate dubla.
    await tx.$queryRaw`SELECT id FROM matches WHERE id = ${matchId}::uuid FOR UPDATE`;
    const match = await tx.match.findUnique({ where: { id: matchId }, select: matchFields });
    if (!match) throw new AppError(404, "MATCH_NOT_FOUND", "Meciul nu există.");
    if (match.startsAt <= new Date()) throw new AppError(409, "MATCH_STARTED", "Meciul a început deja.");
    if (await tx.matchParticipant.findUnique({ where: { matchId_userId: { matchId, userId } } })) {
      throw new AppError(409, "ALREADY_JOINED", "Ești deja înscris la acest meci.");
    }
    if (match._count.participants >= match.maxPlayers) throw new AppError(409, "MATCH_FULL", "Meciul nu mai are locuri libere.");
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { dateOfBirth: true } });
    requireMatchingAge(user.dateOfBirth, match.ageCategory);
    await tx.matchParticipant.create({ data: { matchId, userId } });
    return presentMatch(await tx.match.findUniqueOrThrow({ where: { id: matchId }, select: matchFields }));
  });
}
