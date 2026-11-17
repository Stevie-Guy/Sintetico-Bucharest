import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import type { UserRole } from "../../src/generated/prisma/enums";
import { generateSessionToken } from "../../src/modules/auth/session-token";

const app = createApp();
type Account = { id: string; token: string };
type Booking = { id: string; startsAtUtc: string; endsAtUtc: string };
let owner: Account, player: Account, otherPlayer: Account;
let fieldId: string, date: string, booking: Booking, nextHour: number;
const seniorDob = new Date(`${new Date().getUTCFullYear() - 25}-01-01T00:00:00Z`);

async function account(role: UserRole = "PLAYER", dateOfBirth: Date | null = seniorDob): Promise<Account> {
  const user = await prisma.user.create({ data: { email: `${randomUUID()}@example.com`, passwordHash: "unused", role, name: "Test", phoneNumber: "+40700000000", dateOfBirth } });
  const session = generateSessionToken();
  await prisma.session.create({ data: { tokenHash: session.tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 3600000) } });
  return { id: user.id, token: `Bearer ${session.token}` };
}
const path = (suffix: string) => `/api/terenuri/${fieldId}/${suffix}`;
const decide = (id: string, status = "APPROVED") => request(app).patch(path(`reservations/${id}`)).set("Authorization", owner.token).send({ status });
async function reserve(user = player, approved = true): Promise<Booking> {
  const hour = nextHour++;
  const slot = await request(app).post(path("availability")).set("Authorization", owner.token)
    .send({ date, startsAt: `${hour}:00`, endsAt: `${hour + 1}:00` }).expect(201);
  const response = await request(app).post(path("reservations")).set("Authorization", user.token)
    .send({ availabilityId: slot.body.interval.id, expectedVersion: slot.body.interval.version }).expect(201);
  if (approved) await decide(response.body.reservation.id).expect(200);
  return response.body.reservation;
}
const create = (changes = {}, user = player, selected = booking) => request(app).post("/api/matches").set("Authorization", user.token)
  .send({ reservationId: selected.id, startsAt: selected.startsAtUtc, maxPlayers: 10, ageCategory: "SENIOR", ...changes });
const join = (id: string, user = otherPlayer) => request(app).post(`/api/matches/${id}/participants`).set("Authorization", user.token);
const list = (user = player, query = "") => request(app).get(`/api/matches${query}`).set("Authorization", user.token);
const eligible = (user = player, query = "") => request(app).get(`/api/matches/eligible-reservations${query}`).set("Authorization", user.token);
const details = (id: string, user = player) => request(app).get(`/api/matches/${id}`).set("Authorization", user.token);
const participants = (id: string, query = "") => request(app).get(`/api/matches/${id}/participants${query}`).set("Authorization", owner.token);

beforeEach(async () => {
  await prisma.user.deleteMany();
  owner = await account("FIELD_ADMIN"); player = await account(); otherPlayer = await account();
  date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10); nextHour = 12;
  fieldId = (await prisma.teren.create({ data: { adminId: owner.id, nume: "Teren test", adresa: "București", sector: "SECTOR_1", numarJucatori: 10 } })).id;
  await request(app).put(path("operating-hours")).set("Authorization", owner.token).send({ opensAt: "00:00", closesAt: "24:00" }).expect(200);
  booking = await reserve();
});
afterAll(async () => { await prisma.user.deleteMany(); await prisma.$disconnect(); });

describe("creare meci din rezervare aprobată", () => {
  it("salvează meciul, derivă terenul și ora finală, fără înscriere automată", async () => {
    const { body } = await create().expect(201);
    expect(body.warnings).toEqual([]);
    expect(body.match).toMatchObject({
      startsAt: booking.startsAtUtc, endsAt: booking.endsAtUtc, maxPlayers: 10, ageCategory: "SENIOR",
      creator: { id: player.id }, field: { id: fieldId, numarJucatori: 10 }, timeZone: "Europe/Bucharest",
      participantCount: 0, availablePlaces: 10, isFull: false,
    });
    expect(await prisma.match.count()).toBe(1);
    expect(await prisma.matchParticipant.count()).toBe(0);
    expect(JSON.stringify(body.match)).not.toMatch(/reservationId|playerId|email|phoneNumber|dateOfBirth|passwordHash|tokenHash/);
    expect((await eligible().expect(200)).body.reservations).toEqual([]);
    await join(body.match.id, player).expect(201);
  });

  it("numărul ales poate depăși recomandarea terenului, cu avertisment", async () => {
    const { body } = await create({ maxPlayers: 12 }).expect(201);
    expect(body.match.maxPlayers).toBe(12);
    expect(body.warnings[0].code).toBe("RECOMMENDED_PLAYERS_DIFFERENT");
  });

  it("două cereri simultane pentru aceeași rezervare creează exact un meci", async () => {
    const responses = await Promise.all([create(), create(), create()]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409, 409]);
    expect(responses.filter((r) => r.status === 409).map((r) => r.body.error.code)).toEqual(["RESERVATION_ALREADY_USED", "RESERVATION_ALREADY_USED"]);
    expect(await prisma.match.count()).toBe(1);
    const { id, createdAt, ...data } = await prisma.match.findFirstOrThrow();
    await expect(prisma.match.create({ data })).rejects.toMatchObject({ code: "P2002" });
  });

  it("același teren poate găzdui alt meci pe o rezervare diferită", async () => {
    await create().expect(201);
    const second = await reserve();
    await create({}, player, second).expect(201);
    expect(await prisma.match.count()).toBe(2);
  });

  it("verifică existența și proprietarul rezervării fără a o consuma", async () => {
    expect((await create({ reservationId: randomUUID() }).expect(404)).body.error.code).toBe("RESERVATION_NOT_FOUND");
    expect((await create({}, otherPlayer).expect(403)).body.error.code).toBe("RESERVATION_NOT_OWNED");
    expect(await prisma.match.count()).toBe(0);
    await create().expect(201);
  });

  it("nu acceptă rezervări PENDING sau REJECTED; după aprobare poate crea", async () => {
    const pending = await reserve(player, false);
    expect((await create({}, player, pending).expect(409)).body.error.code).toBe("RESERVATION_NOT_APPROVED");
    await decide(pending.id).expect(200);
    await create({}, player, pending).expect(201);
    const rejected = await reserve(player, false);
    await decide(rejected.id, "REJECTED").expect(200);
    expect((await create({}, player, rejected).expect(409)).body.error.code).toBe("RESERVATION_NOT_APPROVED");
  });

  it("validează ora viitoare și limitele intervalului rezervat", async () => {
    for (const startsAt of [new Date(Date.parse(booking.startsAtUtc) - 1).toISOString(), booking.endsAtUtc]) {
      expect((await create({ startsAt }).expect(400)).body.error.code).toBe("OUTSIDE_RESERVATION");
    }
    expect((await create({ startsAt: new Date(Date.now() - 1000).toISOString() }).expect(400)).body.error.code).toBe("MATCH_IN_PAST");
    expect(await prisma.match.count()).toBe(0);
    const later = new Date(Date.parse(booking.startsAtUtc) + 30 * 60000).toISOString();
    expect((await create({ startsAt: later }).expect(201)).body.match.startsAt).toBe(later);
  });

  it("respinge rezervările expirate, dar permite restul viitor al uneia începute", async () => {
    await prisma.reservation.update({ where: { id: booking.id }, data: {
      startsAtUtc: new Date(Date.now() - 7200000), endsAtUtc: new Date(Date.now() - 3600000),
    } });
    expect((await eligible().expect(200)).body.reservations).toEqual([]);
    await create({ startsAt: new Date(Date.now() + 60000).toISOString() }).expect(400);
    await prisma.reservation.update({ where: { id: booking.id }, data: { endsAtUtc: new Date(Date.now() + 3600000) } });
    expect((await eligible().expect(200)).body.reservations).toHaveLength(1);
    await create({ startsAt: new Date(Date.now() + 60000).toISOString() }).expect(201);
  });

  it("ora cu offset explicit reprezintă același instant UTC", async () => {
    const shifted = new Date(Date.parse(booking.startsAtUtc) + 2 * 3600000).toISOString().replace("Z", "+02:00");
    expect((await create({ startsAt: shifted }).expect(201)).body.match.startsAt).toBe(booking.startsAtUtc);
  });

  it("validează corpul și nu permite falsificarea creatorului sau a terenului", async () => {
    for (const changes of [{ maxPlayers: 0 }, { maxPlayers: "10" }, { ageCategory: "bad" }, { reservationId: "bad" }, { creatorId: otherPlayer.id }, { fieldId }, { endsAt: booking.endsAtUtc }]) {
      expect((await create(changes).expect(400)).body.error.code).toBe("VALIDATION_ERROR");
    }
    expect(await prisma.match.count()).toBe(0);
  });

  it("o eroare de salvare nu consumă rezervarea", async () => {
    await prisma.$executeRawUnsafe('ALTER TABLE matches ADD CONSTRAINT test_reject_match CHECK (false) NOT VALID');
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await create().expect(500);
      expect(await prisma.match.count()).toBe(0);
    } finally {
      log.mockRestore();
      await prisma.$executeRawUnsafe('ALTER TABLE matches DROP CONSTRAINT test_reject_match');
    }
    expect((await eligible().expect(200)).body.reservations).toHaveLength(1);
    await create().expect(201);
  });

  it("baza refuză capacitatea zero și un interval gol chiar la scriere directă", async () => {
    const data = { reservationId: booking.id, creatorId: player.id, startsAt: new Date(booking.startsAtUtc), endsAt: new Date(booking.endsAtUtc), maxPlayers: 10, ageCategory: "SENIOR" as const };
    await expect(prisma.match.create({ data: { ...data, maxPlayers: 0 } })).rejects.toThrow();
    await expect(prisma.match.create({ data: { ...data, endsAt: data.startsAt } })).rejects.toThrow();
    expect(await prisma.match.count()).toBe(0);
  });
});

describe("selectorul de rezervări și lista de meciuri", () => {
  it("selectorul listează paginat numai rezervările proprii, aprobate și nefolosite", async () => {
    const second = await reserve();
    await reserve(otherPlayer);
    await reserve(player, false);
    const rejected = await reserve(player, false); await decide(rejected.id, "REJECTED").expect(200);
    const first = await eligible(player, "?pageSize=1").expect(200);
    expect(first.body).toMatchObject({ page: 1, pageSize: 1, hasMore: true });
    expect(first.body.reservations.map((r: Booking) => r.id)).toEqual([booking.id]);
    const last = await eligible(player, "?page=2&pageSize=1").expect(200);
    expect(last.body.hasMore).toBe(false);
    expect(last.body.reservations.map((r: Booking) => r.id)).toEqual([second.id]);
    await create().expect(201);
    expect((await eligible().expect(200)).body.reservations.map((r: Booking) => r.id)).toEqual([second.id]);
    await eligible(player, "?playerId=forged").expect(400);
    await eligible(owner).expect(403);
  });

  it("orice rol autentificat vede imediat meciul și detaliile fără date private", async () => {
    const { body } = await create().expect(201);
    for (const user of [owner, otherPlayer, await account("ADMIN"), await account("CHAMPIONSHIP_ORGANIZER")]) {
      const all = await list(user).expect(200);
      expect(all.body.matches[0].id).toBe(body.match.id);
      expect((await details(body.match.id, user).expect(200)).body.match).toEqual(body.match);
      expect(JSON.stringify(all.body)).not.toMatch(/reservationId|email|phoneNumber|dateOfBirth|passwordHash|tokenHash/);
    }
  });

  it("listează meciurile viitoare în ordine, paginat, inclusiv cele pline", async () => {
    const first = (await create({ maxPlayers: 1 }).expect(201)).body.match;
    await join(first.id).expect(201);
    const second = (await create({}, player, await reserve()).expect(201)).body.match;
    const page1 = await list(player, "?pageSize=1").expect(200);
    expect(page1.body.hasMore).toBe(true);
    expect(page1.body.matches[0]).toMatchObject({ id: first.id, isFull: true, availablePlaces: 0 });
    const page2 = await list(player, "?page=2&pageSize=1").expect(200);
    expect(page2.body.hasMore).toBe(false);
    expect(page2.body.matches[0].id).toBe(second.id);
    await prisma.match.update({ where: { id: first.id }, data: { startsAt: new Date(Date.now() - 1000) } });
    expect((await list().expect(200)).body.matches.map((m: { id: string }) => m.id)).toEqual([second.id]);
    await details(first.id).expect(200);
    expect((await list(player, "?page=99").expect(200)).body.matches).toEqual([]);
  });

  it("validează identificatorii, paginarea și autentificarea pe toate citirile", async () => {
    for (const url of ["/api/matches", "/api/matches/eligible-reservations", `/api/matches/${randomUUID()}`, `/api/matches/${randomUUID()}/participants`]) {
      await request(app).get(url).expect(401);
    }
    await list(player, "?pageSize=101").expect(400);
    await list(player, "?page=0").expect(400);
    await details("bad").expect(400);
    await details(randomUUID()).expect(404);
    await participants("bad").expect(400);
    await participants(randomUUID()).expect(404);
  });

  it("crearea cere rol de jucător; organizatorul și ADMIN păstrează regulile de proprietate", async () => {
    await request(app).post("/api/matches").send({}).expect(401);
    await create({}, owner).expect(403);
    for (const role of ["CHAMPIONSHIP_ORGANIZER", "ADMIN"] as const) {
      const user = await account(role);
      await create({}, user).expect(403);
      const own = await reserve(user);
      const created = (await create({}, user, own).expect(201)).body.match;
      await join(created.id, user).expect(201);
    }
  });
});

describe("înscrieri și limita locurilor", () => {
  it("înscrie o singură dată, actualizează locurile și afișează participantul", async () => {
    const match = (await create({ maxPlayers: 2 }).expect(201)).body.match;
    const result = await join(match.id).expect(201);
    expect(result.body.match).toMatchObject({ participantCount: 1, availablePlaces: 1, isFull: false });
    expect((await join(match.id).expect(409)).body.error.code).toBe("ALREADY_JOINED");
    const roster = await participants(match.id).expect(200);
    expect(roster.body.participants[0].user).toEqual({ id: otherPlayer.id, name: "Test" });
    expect(JSON.stringify(roster.body)).not.toMatch(/email|phoneNumber|dateOfBirth|passwordHash|tokenHash/);
    expect((await details(match.id).expect(200)).body.match.participantCount).toBe(1);
    await expect(prisma.matchParticipant.create({ data: { matchId: match.id, userId: otherPlayer.id } })).rejects.toMatchObject({ code: "P2002" });
  });

  it("două persoane concurente pentru ultimul loc: exact una reușește", async () => {
    const match = (await create({ maxPlayers: 1 }).expect(201)).body.match;
    const responses = await Promise.all([join(match.id, player), join(match.id, otherPlayer)]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(responses.find((r) => r.status === 409)?.body.error.code).toBe("MATCH_FULL");
    expect(await prisma.matchParticipant.count({ where: { matchId: match.id } })).toBe(1);
    expect((await details(match.id).expect(200)).body.match).toMatchObject({ participantCount: 1, availablePlaces: 0, isFull: true });
    const late = await account();
    expect((await join(match.id, late).expect(409)).body.error.code).toBe("MATCH_FULL");
  });

  it("reîncercări simultane ale aceleiași persoane nu consumă două locuri", async () => {
    const match = (await create({ maxPlayers: 2 }).expect(201)).body.match;
    const responses = await Promise.all([join(match.id), join(match.id)]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(responses.find((r) => r.status === 409)?.body.error.code).toBe("ALREADY_JOINED");
    expect(await prisma.matchParticipant.count()).toBe(1);
  });

  it("păstrează capacitatea la un val de cereri și paginează participanții", async () => {
    const match = (await create({ maxPlayers: 2 }).expect(201)).body.match;
    const users = [player, otherPlayer, await account(), await account(), await account()];
    const responses = await Promise.all(users.map((user) => join(match.id, user)));
    expect(responses.map((r) => r.status).sort()).toEqual([201, 201, 409, 409, 409]);
    const first = await participants(match.id, "?pageSize=1").expect(200);
    const second = await participants(match.id, "?page=2&pageSize=1").expect(200);
    expect(first.body.hasMore).toBe(true); expect(second.body.hasMore).toBe(false);
    expect(first.body.participants[0].user.id).not.toBe(second.body.participants[0].user.id);
    await participants(match.id, "?pageSize=101").expect(400);
  });

  it("nu înscrie după început sau la un meci inexistent", async () => {
    const match = (await create().expect(201)).body.match;
    await prisma.match.update({ where: { id: match.id }, data: { startsAt: new Date(Date.now() - 1000) } });
    expect((await join(match.id).expect(409)).body.error.code).toBe("MATCH_STARTED");
    expect((await join(randomUUID()).expect(404)).body.error.code).toBe("MATCH_NOT_FOUND");
    await join("bad").expect(400);
    expect(await prisma.matchParticipant.count()).toBe(0);
  });

  it("cere profilul cu data nașterii și categoria potrivită", async () => {
    const match = (await create({ ageCategory: "VETERANS_35_PLUS" }).expect(201)).body.match;
    expect((await join(match.id).expect(403)).body.error.code).toBe("AGE_CATEGORY_MISMATCH");
    const incomplete = await account("PLAYER", null);
    expect((await join(match.id, incomplete).expect(400)).body.error.code).toBe("DATE_OF_BIRTH_REQUIRED");
    const veteran = await account("PLAYER", new Date("1980-01-01"));
    await join(match.id, veteran).expect(201);
    expect(await prisma.matchParticipant.count()).toBe(1);
  });

  it("cere autentificare, rol de jucător și identitate din sesiune", async () => {
    const match = (await create().expect(201)).body.match;
    await request(app).post(`/api/matches/${match.id}/participants`).expect(401);
    await join(match.id, owner).expect(403);
    await join(match.id).send({ userId: player.id }).expect(400);
    expect(await prisma.matchParticipant.count()).toBe(0);
  });
});
