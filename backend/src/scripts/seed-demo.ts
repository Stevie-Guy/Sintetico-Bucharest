/**
 * Populează baza de dezvoltare cu date demo pentru prezentare: jucători, administratori de teren,
 * terenuri cu program și intervale, rezervări (în așteptare, aprobate, respinse), notificări și meciuri.
 *
 *   cd backend
 *   npm run db:seed
 *
 * Toate conturile demo au emailuri `@demo.sintetico.ro` și parola DEMO_PASSWORD de mai jos.
 * Comanda se poate rula de mai multe ori: șterge întâi conturile demo (împreună cu tot ce le aparține,
 * prin ștergere în cascadă) și le recreează, cu datele mutate față de ziua curentă.
 * Alte conturi (ex. Administratorul creat cu `npm run create-admin`) nu sunt atinse.
 * Nu se rulează pe o bază de producție.
 */
import type { MatchAgeCategory, ReservationStatus, Sector, UserRole } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../modules/auth/password-hasher";
import { formatTime } from "../modules/teren/schedule.schemas";
import { FIELD_TIME_ZONE, resolveSlotTimes } from "../modules/teren/slot-time";

const DEMO_DOMAIN = "demo.sintetico.ro";
// Parolă doar pentru datele demo din baza locală; respectă regulile de la crearea contului.
const DEMO_PASSWORD = "Sintetico1!";

type DemoUser = {
  key: string; name: string; role: UserRole; birth: string;
  position?: "PORTAR" | "FUNDAS" | "MIJLOCAS" | "ATACANT"; foot?: "STANGA" | "DREAPTA" | "AMBIDEXTRU";
  // Obligatoriu: fără nume și telefon contul nu poate face nicio acțiune în aplicație.
  phone: string;
};

const users: DemoUser[] = [
  // Administratori de teren
  { key: "ion.ionescu", name: "Ion Ionescu", role: "FIELD_ADMIN", birth: "1980-03-12", phone: "+40722100200" },
  { key: "maria.dobre", name: "Maria Dobre", role: "FIELD_ADMIN", birth: "1987-09-04", phone: "+40733200300" },
  // Organizator de campionat (are și drepturile unui jucător)
  { key: "radu.marin", name: "Radu Marin", role: "CHAMPIONSHIP_ORGANIZER", birth: "1990-06-21", position: "MIJLOCAS", foot: "DREAPTA", phone: "+40744300400" },
  // Jucători seniori
  { key: "andrei.popescu", name: "Andrei Popescu", role: "PLAYER", birth: "1998-05-14", position: "ATACANT", foot: "DREAPTA", phone: "+40755400500" },
  { key: "mihai.stan", name: "Mihai Stan", role: "PLAYER", birth: "2000-11-02", position: "MIJLOCAS", foot: "STANGA", phone: "+40766500600" },
  { key: "alex.georgescu", name: "Alexandru Georgescu", role: "PLAYER", birth: "1996-01-30", position: "FUNDAS", foot: "DREAPTA", phone: "+40777000101" },
  { key: "vlad.constantin", name: "Vlad Constantin", role: "PLAYER", birth: "2001-07-19", position: "PORTAR", foot: "DREAPTA", phone: "+40777000102" },
  { key: "cristi.dumitru", name: "Cristian Dumitru", role: "PLAYER", birth: "1999-04-08", position: "ATACANT", foot: "STANGA", phone: "+40777000103" },
  { key: "bogdan.ene", name: "Bogdan Ene", role: "PLAYER", birth: "1995-12-25", position: "MIJLOCAS", foot: "AMBIDEXTRU", phone: "+40777000104" },
  { key: "stefan.tudor", name: "Ștefan Tudor", role: "PLAYER", birth: "2003-02-11", position: "FUNDAS", foot: "STANGA", phone: "+40777000105" },
  { key: "george.nistor", name: "George Nistor", role: "PLAYER", birth: "1997-08-03", position: "ATACANT", foot: "DREAPTA", phone: "+40777000106" },
  { key: "darius.lazar", name: "Darius Lazăr", role: "PLAYER", birth: "2002-10-27", position: "MIJLOCAS", foot: "DREAPTA", phone: "+40777000107" },
  // Veterani 35+
  { key: "dan.voicu", name: "Dan Voicu", role: "PLAYER", birth: "1982-05-05", position: "FUNDAS", foot: "DREAPTA", phone: "+40777000108" },
  { key: "florin.matei", name: "Florin Matei", role: "PLAYER", birth: "1979-09-16", position: "PORTAR", foot: "STANGA", phone: "+40777000109" },
  { key: "catalin.ilie", name: "Cătălin Ilie", role: "PLAYER", birth: "1985-01-22", position: "MIJLOCAS", foot: "DREAPTA", phone: "+40777000110" },
  { key: "sorin.badea", name: "Sorin Badea", role: "PLAYER", birth: "1977-03-09", position: "ATACANT", foot: "DREAPTA", phone: "+40777000111" },
  // U18
  { key: "luca.preda", name: "Luca Preda", role: "PLAYER", birth: "2010-04-17", position: "ATACANT", foot: "DREAPTA", phone: "+40777000112" },
  { key: "matei.rusu", name: "Matei Rusu", role: "PLAYER", birth: "2009-08-29", position: "MIJLOCAS", foot: "STANGA", phone: "+40777000113" },
  { key: "david.oprea", name: "David Oprea", role: "PLAYER", birth: "2010-12-01", position: "FUNDAS", foot: "DREAPTA", phone: "+40777000114" },
];

type DemoField = { key: string; admin: string; name: string; address: string; sector: Sector; players: number; opens: number; closes: number };

const fields: DemoField[] = [
  { key: "arena-floreasca", admin: "ion.ionescu", name: "Arena Floreasca", address: "Str. Glinka 10, București", sector: "SECTOR_1", players: 10, opens: 8 * 60, closes: 23 * 60 },
  { key: "baza-tei", admin: "ion.ionescu", name: "Baza Sportivă Tei", address: "Șos. Pipera 2, București", sector: "SECTOR_2", players: 12, opens: 9 * 60, closes: 23 * 60 },
  { key: "titan-park", admin: "ion.ionescu", name: "Titan Park Fotbal", address: "Bd. Nicolae Grigorescu 40, București", sector: "SECTOR_3", players: 10, opens: 8 * 60, closes: 22 * 60 },
  { key: "tineretului", admin: "maria.dobre", name: "Sintetic Tineretului", address: "Bd. Gheorghe Șincai 5, București", sector: "SECTOR_4", players: 14, opens: 8 * 60, closes: 23 * 60 },
  { key: "rahova", admin: "maria.dobre", name: "Teren Rahova", address: "Calea Rahovei 266, București", sector: "SECTOR_5", players: 10, opens: 10 * 60, closes: 22 * 60 },
  { key: "drumul-taberei", admin: "maria.dobre", name: "Complex Drumul Taberei", address: "Str. Brașov 25, București", sector: "SECTOR_6", players: 12, opens: 8 * 60, closes: 23 * 60 },
];

// Intervalele publicate în fiecare zi (minute de la miezul nopții, ora București).
const dailySlots = [
  [10 * 60, 11 * 60 + 30], [17 * 60, 18 * 60 + 30], [18 * 60 + 30, 20 * 60], [20 * 60, 21 * 60 + 30],
] as const;
const DAYS_BEFORE = 2;
const DAYS_AFTER = 7;

type DemoReservation = { field: string; player: string; day: number; slot: number; status: ReservationStatus; read?: boolean };

// `day` e relativ la ziua de azi; `slot` e indexul din dailySlots.
const reservations: DemoReservation[] = [
  // Trecute (istoric)
  { field: "arena-floreasca", player: "andrei.popescu", day: -2, slot: 2, status: "APPROVED", read: true },
  { field: "tineretului", player: "dan.voicu", day: -1, slot: 3, status: "APPROVED", read: true },
  // Viitoare, aprobate: pe ele se creează meciurile
  { field: "arena-floreasca", player: "andrei.popescu", day: 1, slot: 2, status: "APPROVED" },
  { field: "baza-tei", player: "radu.marin", day: 1, slot: 3, status: "APPROVED", read: true },
  { field: "tineretului", player: "mihai.stan", day: 2, slot: 1, status: "APPROVED", read: true },
  { field: "titan-park", player: "dan.voicu", day: 2, slot: 2, status: "APPROVED", read: true },
  { field: "drumul-taberei", player: "andrei.popescu", day: 3, slot: 3, status: "APPROVED" },
  { field: "rahova", player: "luca.preda", day: 3, slot: 1, status: "APPROVED", read: true },
  { field: "arena-floreasca", player: "radu.marin", day: 4, slot: 2, status: "APPROVED", read: true },
  { field: "baza-tei", player: "george.nistor", day: 5, slot: 0, status: "APPROVED", read: true },
  { field: "tineretului", player: "florin.matei", day: 6, slot: 2, status: "APPROVED", read: true },
  // Aprobată, încă fără meci: apare la „Creează meci”
  { field: "titan-park", player: "andrei.popescu", day: 5, slot: 3, status: "APPROVED" },
  // În așteptare: apar la administratorul terenului pentru aprobare
  { field: "arena-floreasca", player: "mihai.stan", day: 2, slot: 3, status: "PENDING" },
  { field: "baza-tei", player: "andrei.popescu", day: 4, slot: 1, status: "PENDING" },
  { field: "titan-park", player: "vlad.constantin", day: 3, slot: 2, status: "PENDING" },
  { field: "rahova", player: "cristi.dumitru", day: 4, slot: 3, status: "PENDING" },
  { field: "drumul-taberei", player: "bogdan.ene", day: 5, slot: 2, status: "PENDING" },
  // Respinse
  { field: "tineretului", player: "andrei.popescu", day: 2, slot: 2, status: "REJECTED", read: true },
  { field: "rahova", player: "stefan.tudor", day: 1, slot: 2, status: "REJECTED" },
];

type DemoMatch = { reservation: number; category: MatchAgeCategory; maxPlayers?: number; participants: string[] };

// `reservation` e indexul din lista de mai sus.
const matches: DemoMatch[] = [
  { reservation: 2, category: "SENIOR", participants: ["andrei.popescu", "mihai.stan", "alex.georgescu", "vlad.constantin", "cristi.dumitru", "bogdan.ene", "stefan.tudor"] },
  { reservation: 3, category: "SENIOR", participants: ["radu.marin", "george.nistor", "darius.lazar", "alex.georgescu"] },
  // Plin: 10 din 10
  { reservation: 4, category: "SENIOR", maxPlayers: 10, participants: ["mihai.stan", "andrei.popescu", "alex.georgescu", "vlad.constantin", "cristi.dumitru", "bogdan.ene", "stefan.tudor", "george.nistor", "darius.lazar", "radu.marin"] },
  { reservation: 5, category: "VETERANS_35_PLUS", participants: ["dan.voicu", "florin.matei", "catalin.ilie"] },
  { reservation: 6, category: "SENIOR", participants: ["andrei.popescu", "george.nistor"] },
  { reservation: 7, category: "U18", participants: ["luca.preda", "matei.rusu", "david.oprea"] },
  { reservation: 8, category: "SENIOR", maxPlayers: 8, participants: ["radu.marin", "mihai.stan", "bogdan.ene", "darius.lazar", "stefan.tudor"] },
  { reservation: 9, category: "SENIOR", participants: ["george.nistor"] },
  { reservation: 10, category: "VETERANS_35_PLUS", participants: ["florin.matei", "dan.voicu", "sorin.badea", "catalin.ilie"] },
];

const email = (key: string) => `${key}@${DEMO_DOMAIN}`;

/** Ziua de azi în București, ca dată `@db.Date` (miezul nopții UTC). */
function bucharestToday(): Date {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: FIELD_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
}

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

async function main() {
  const removed = await prisma.user.deleteMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } } });
  if (removed.count) console.log(`Șterse ${removed.count} conturi demo vechi.`);

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const userIds = new Map<string, string>();
  for (const user of users) {
    const created = await prisma.user.create({ data: {
      email: email(user.key), passwordHash, role: user.role, name: user.name,
      dateOfBirth: new Date(`${user.birth}T00:00:00.000Z`),
      preferredPosition: user.position, dominantFoot: user.foot, phoneNumber: user.phone,
    } });
    userIds.set(user.key, created.id);
  }

  const today = bucharestToday();
  const fieldIds = new Map<string, string>();
  const fieldAdmins = new Map<string, string>();
  const slotIds = new Map<string, string>();
  for (const field of fields) {
    const adminId = userIds.get(field.admin)!;
    const created = await prisma.teren.create({ data: {
      nume: field.name, adresa: field.address, sector: field.sector, numarJucatori: field.players, adminId,
      operatingHours: { create: { opensAt: field.opens, closesAt: field.closes } },
    } });
    fieldIds.set(field.key, created.id);
    fieldAdmins.set(field.key, adminId);
    for (let day = -DAYS_BEFORE; day <= DAYS_AFTER; day++) {
      for (const [index, [startsAt, endsAt]] of dailySlots.entries()) {
        if (startsAt < field.opens || endsAt > field.closes) continue;
        const slot = await prisma.fieldAvailability.create({ data: { fieldId: created.id, date: addDays(today, day), startsAt, endsAt } });
        slotIds.set(`${field.key}/${day}/${index}`, slot.id);
      }
    }
  }

  const reservationIds: string[] = [];
  for (const [index, item] of reservations.entries()) {
    const availabilityId = slotIds.get(`${item.field}/${item.day}/${item.slot}`);
    if (!availabilityId) throw new Error(`Intervalul ${item.field}/${item.day}/${item.slot} nu există.`);
    const [startsAt, endsAt] = dailySlots[item.slot];
    const date = addDays(today, item.day);
    const times = resolveSlotTimes({ date, startsAt, endsAt });
    if (!times) throw new Error(`Ora intervalului ${item.field}/${item.day}/${item.slot} nu se poate rezolva.`);
    const createdAt = minutesAgo(60 * 24 * 3 - index * 180);
    const decidedAt = item.status === "PENDING" ? null : new Date(createdAt.getTime() + 90 * 60_000);
    const playerId = userIds.get(item.player)!;
    const label = `${date.toISOString().slice(0, 10)}, ${formatTime(startsAt)}–${formatTime(endsAt)}`;
    const reservation = await prisma.reservation.create({ data: {
      fieldId: fieldIds.get(item.field)!, playerId, availabilityId, date, startsAt, endsAt, ...times,
      status: item.status, createdAt, decidedAt,
    } });
    reservationIds.push(reservation.id);

    // Aceleași notificări pe care le-ar fi trimis cererea și decizia din aplicație.
    await prisma.notification.create({ data: {
      recipientId: fieldAdmins.get(item.field)!, reservationId: reservation.id, type: "RESERVATION_REQUESTED",
      message: `Cerere nouă de rezervare: ${label}. Este necesară aprobarea ta.`,
      createdAt, readAt: item.status === "PENDING" ? null : decidedAt,
    } });
    if (decidedAt) {
      const approved = item.status === "APPROVED";
      await prisma.notification.create({ data: {
        recipientId: playerId, reservationId: reservation.id,
        type: approved ? "RESERVATION_APPROVED" : "RESERVATION_REJECTED",
        message: `Rezervarea din ${label} a fost ${approved ? "aprobată" : "respinsă"}.`,
        createdAt: decidedAt, readAt: item.read ? decidedAt : null,
      } });
    }
  }

  for (const item of matches) {
    const reservation = reservations[item.reservation];
    const field = fields.find((candidate) => candidate.key === reservation.field)!;
    const record = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationIds[item.reservation] } });
    await prisma.match.create({ data: {
      reservationId: record.id, creatorId: record.playerId, startsAt: record.startsAtUtc, endsAt: record.endsAtUtc,
      maxPlayers: item.maxPlayers ?? field.players, ageCategory: item.category,
      participants: { create: item.participants.map((key, order) => ({ userId: userIds.get(key)!, joinedAt: minutesAgo(600 - order * 30) })) },
    } });
  }

  console.log(`Date demo create: ${users.length} conturi, ${fields.length} terenuri, ${slotIds.size} intervale, ` +
    `${reservations.length} rezervări, ${matches.length} meciuri.`);
  console.log(`Parola tuturor conturilor demo: ${DEMO_PASSWORD}`);
  console.log(`  Jucător:              ${email("andrei.popescu")}`);
  console.log(`  Administrator teren:  ${email("ion.ionescu")}`);
  console.log(`  Organizator:          ${email("radu.marin")}`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
