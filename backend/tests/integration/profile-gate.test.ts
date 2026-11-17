import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import type { UserRole } from "../../src/generated/prisma/enums";
import { generateSessionToken } from "../../src/modules/auth/session-token";

// Fără nume și telefon în profil, utilizatorul poate doar să vadă aplicația; orice acțiune e refuzată.
const app = createApp();
type Account = { id: string; token: string };
const complete = { name: "Test", phoneNumber: "+40700000000" };
const dateOfBirth = new Date(`${new Date().getUTCFullYear() - 25}-01-01T00:00:00Z`);
const date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
let fieldId: string;

async function account(role: UserRole, profile: { name?: string; phoneNumber?: string } = {}): Promise<Account> {
  const user = await prisma.user.create({
    data: { email: `${randomUUID()}@example.com`, passwordHash: "unused", role, dateOfBirth, ...profile },
  });
  const session = generateSessionToken();
  await prisma.session.create({ data: { tokenHash: session.tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 3600000) } });
  return { id: user.id, token: `Bearer ${session.token}` };
}

function expectIncomplete(response: request.Response) {
  expect(response.status).toBe(403);
  expect(response.body.error.code).toBe("PROFILE_INCOMPLETE");
}

beforeEach(async () => {
  await prisma.user.deleteMany();
});
afterAll(async () => { await prisma.user.deleteMany(); await prisma.$disconnect(); });

describe("profil incomplet (nume și telefon obligatorii)", () => {
  it("sesiunea spune dacă profilul e complet, iar după completare acțiunile merg", async () => {
    const owner = await account("FIELD_ADMIN");
    expect((await request(app).get("/api/auth/me").set("Authorization", owner.token).expect(200)).body.user.profileComplete).toBe(false);

    const field = { nume: "Teren test", adresa: "Str. Test 1, București", sector: "SECTOR_1", numarJucatori: 10 };
    expectIncomplete(await request(app).post("/api/terenuri").set("Authorization", owner.token).send(field));

    // Doar numele nu ajunge.
    await request(app).patch("/api/profile").set("Authorization", owner.token).send({ name: "Ion" }).expect(200);
    expectIncomplete(await request(app).post("/api/terenuri").set("Authorization", owner.token).send(field));

    await request(app).patch("/api/profile").set("Authorization", owner.token).send({ phoneNumber: "+40712345678" }).expect(200);
    expect((await request(app).get("/api/auth/me").set("Authorization", owner.token).expect(200)).body.user.profileComplete).toBe(true);
    await request(app).post("/api/terenuri").set("Authorization", owner.token).send(field).expect(201);

    // Ștergerea telefonului blochează din nou acțiunile.
    await request(app).patch("/api/profile").set("Authorization", owner.token).send({ phoneNumber: null }).expect(200);
    expectIncomplete(await request(app).post("/api/terenuri").set("Authorization", owner.token).send(field));
  });

  it("administratorul de teren fără profil complet nu poate gestiona programul sau rezervările", async () => {
    const owner = await account("FIELD_ADMIN");
    fieldId = (await prisma.teren.create({ data: { adminId: owner.id, nume: "Teren", adresa: "București", sector: "SECTOR_1", numarJucatori: 10 } })).id;
    const path = (suffix: string) => `/api/terenuri/${fieldId}/${suffix}`;

    expectIncomplete(await request(app).put(`/api/terenuri/${fieldId}`).set("Authorization", owner.token)
      .send({ nume: "Teren nou", adresa: "Str. Test 1, București", sector: "SECTOR_1", numarJucatori: 10 }));
    expectIncomplete(await request(app).put(path("operating-hours")).set("Authorization", owner.token).send({ opensAt: "00:00", closesAt: "24:00" }));
    expectIncomplete(await request(app).delete(path("operating-hours")).set("Authorization", owner.token));
    expectIncomplete(await request(app).post(path("availability")).set("Authorization", owner.token).send({ date, startsAt: "12:00", endsAt: "13:00" }));
    expectIncomplete(await request(app).put(path(`availability/${randomUUID()}`)).set("Authorization", owner.token).send({ date, startsAt: "12:00", endsAt: "13:00" }));
    expectIncomplete(await request(app).delete(path(`availability/${randomUUID()}`)).set("Authorization", owner.token));
    expectIncomplete(await request(app).patch(path(`reservations/${randomUUID()}`)).set("Authorization", owner.token).send({ status: "APPROVED" }));

    // Citirile rămân permise.
    await request(app).get(path("operating-hours")).set("Authorization", owner.token).expect(200);
    await request(app).get(path("reservations")).set("Authorization", owner.token).expect(200);
  });

  it("jucătorul fără profil complet poate vedea, dar nu poate rezerva, crea meciuri sau se înscrie", async () => {
    const owner = await account("FIELD_ADMIN", complete);
    const creator = await account("PLAYER", complete);
    const player = await account("PLAYER", { name: "Fără telefon" });
    fieldId = (await prisma.teren.create({ data: { adminId: owner.id, nume: "Teren", adresa: "București", sector: "SECTOR_1", numarJucatori: 10 } })).id;
    const path = (suffix: string) => `/api/terenuri/${fieldId}/${suffix}`;
    await request(app).put(path("operating-hours")).set("Authorization", owner.token).send({ opensAt: "00:00", closesAt: "24:00" }).expect(200);
    const slot = (await request(app).post(path("availability")).set("Authorization", owner.token).send({ date, startsAt: "12:00", endsAt: "13:00" }).expect(201)).body.interval;
    const other = (await request(app).post(path("availability")).set("Authorization", owner.token).send({ date, startsAt: "14:00", endsAt: "15:00" }).expect(201)).body.interval;

    expectIncomplete(await request(app).post(path("reservations")).set("Authorization", player.token)
      .send({ availabilityId: slot.id, expectedVersion: slot.version }));

    const reservation = (await request(app).post(path("reservations")).set("Authorization", creator.token)
      .send({ availabilityId: other.id, expectedVersion: other.version }).expect(201)).body.reservation;
    await request(app).patch(path(`reservations/${reservation.id}`)).set("Authorization", owner.token).send({ status: "APPROVED" }).expect(200);
    const match = (await request(app).post("/api/matches").set("Authorization", creator.token)
      .send({ reservationId: reservation.id, startsAt: reservation.startsAtUtc, maxPlayers: 10, ageCategory: "SENIOR" }).expect(201)).body.match;

    expectIncomplete(await request(app).post("/api/matches").set("Authorization", player.token)
      .send({ reservationId: reservation.id, startsAt: reservation.startsAtUtc, maxPlayers: 10, ageCategory: "SENIOR" }));
    expectIncomplete(await request(app).post(`/api/matches/${match.id}/participants`).set("Authorization", player.token));

    await request(app).get("/api/matches").set("Authorization", player.token).expect(200);
    await request(app).get(`/api/matches/${match.id}`).set("Authorization", player.token).expect(200);
    await request(app).get(path(`availability?date=${date}`)).set("Authorization", player.token).expect(200);
    await request(app).get("/api/reservations").set("Authorization", player.token).expect(200);
    await request(app).get("/api/notifications").set("Authorization", player.token).expect(200);
    expect((await request(app).get(`/api/matches/${match.id}/participants`).set("Authorization", player.token).expect(200))
      .body.participants).toEqual([]);
  });

  it("Administratorul poate face acțiuni prin API fără nume și telefon", async () => {
    const admin = await account("ADMIN");
    // Sesiunea arată starea reală a profilului; aplicația o folosește când adminul vede aplicația ca alt rol.
    expect((await request(app).get("/api/auth/me").set("Authorization", admin.token).expect(200)).body.user.profileComplete).toBe(false);
    await request(app).post("/api/terenuri").set("Authorization", admin.token)
      .send({ nume: "Teren admin", adresa: "Str. Test 1, București", sector: "SECTOR_1", numarJucatori: 10 }).expect(201);
  });

  it("profilul se poate citi și completa din orice rol", async () => {
    for (const role of ["PLAYER", "FIELD_ADMIN", "CHAMPIONSHIP_ORGANIZER", "ADMIN"] as const) {
      const user = await account(role);
      await request(app).get("/api/profile").set("Authorization", user.token).expect(200);
      const response = await request(app).patch("/api/profile").set("Authorization", user.token).send(complete).expect(200);
      expect(response.body.user).toMatchObject(complete);
    }
  });
});
