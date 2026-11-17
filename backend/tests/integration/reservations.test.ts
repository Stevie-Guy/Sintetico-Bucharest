import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import type { UserRole } from "../../src/generated/prisma/enums";
import { generateSessionToken } from "../../src/modules/auth/session-token";
import { resolveSlotTimes } from "../../src/modules/teren/slot-time";

const app = createApp();
type Account = { id: string; token: string };
let owner: Account, otherOwner: Account, player: Account, otherPlayer: Account;
let fieldId: string, date: string, intervalId: string;

async function account(role: UserRole): Promise<Account> {
  const user = await prisma.user.create({ data: { email: `${randomUUID()}@example.com`, passwordHash: "unused", role, name: "Test", phoneNumber: "+40700000000" } });
  const session = generateSessionToken();
  await prisma.session.create({ data: { tokenHash: session.tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 3600000) } });
  return { id: user.id, token: `Bearer ${session.token}` };
}
const path = (suffix: string, field = fieldId) => `/api/terenuri/${field}/${suffix}`;
const book = (user = player, id = intervalId, version = 1, field = fieldId) => request(app).post(path("reservations", field))
  .set("Authorization", user.token).send({ availabilityId: id, expectedVersion: version });
const decide = (id: string, status = "APPROVED", user = owner, field = fieldId) => request(app).patch(path(`reservations/${id}`, field))
  .set("Authorization", user.token).send({ status });
const available = (day = date) => request(app).get(path(`availability?date=${day}`)).set("Authorization", player.token);
const inbox = (user = owner, query = "") => request(app).get(`/api/notifications${query}`).set("Authorization", user.token);
const edit = (changes = {}) => request(app).put(path(`availability/${intervalId}`)).set("Authorization", owner.token)
  .send({ date, startsAt: "14:00", endsAt: "15:00", ...changes });
const remove = () => request(app).delete(path(`availability/${intervalId}`)).set("Authorization", owner.token);

beforeEach(async () => {
  await prisma.user.deleteMany();
  owner = await account("FIELD_ADMIN"); otherOwner = await account("FIELD_ADMIN");
  player = await account("PLAYER"); otherPlayer = await account("PLAYER");
  date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  fieldId = (await prisma.teren.create({ data: { adminId: owner.id, nume: "Test", adresa: "București", sector: "SECTOR_1", numarJucatori: 10 } })).id;
  await request(app).put(path("operating-hours")).set("Authorization", owner.token).send({ opensAt: "00:00", closesAt: "24:00" }).expect(200);
  const slot = await request(app).post(path("availability")).set("Authorization", owner.token).send({ date, startsAt: "12:00", endsAt: "13:00" }).expect(201);
  intervalId = slot.body.interval.id;
});
afterAll(async () => { await prisma.user.deleteMany(); await prisma.$disconnect(); });

describe("selectarea și rezervarea intervalelor libere", () => {
  it("rezervă intervalul afișat ca PENDING, îl ascunde și notifică proprietarul", async () => {
    const slots = await available().expect(200);
    expect(slots.body.intervals[0]).toMatchObject({ id: intervalId, version: 1, date, startsAt: "12:00", endsAt: "13:00" });
    const response = await book().expect(201);
    expect(response.body.reservation).toMatchObject({ fieldId, availabilityId: intervalId, playerId: player.id, status: "PENDING", decidedAt: null });
    expect((await available().expect(200)).body.intervals).toEqual([]);
    const notifications = await inbox().expect(200);
    expect(notifications.body.unreadCount).toBe(1);
    expect(notifications.body.notifications[0]).toMatchObject({ type: "RESERVATION_REQUESTED", reservationId: response.body.reservation.id });
    expect((await inbox(otherOwner).expect(200)).body.notifications).toEqual([]);
    expect((await book(otherPlayer).expect(409)).body.error.code).toBe("INTERVAL_RESERVED");
  });

  it("o singură cerere câștigă la rezervarea simultană, cu o singură notificare", async () => {
    const responses = await Promise.all([book(), book(otherPlayer), book(), book(otherPlayer)]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409, 409, 409]);
    expect(await prisma.reservation.count()).toBe(1);
    expect(await prisma.notification.count()).toBe(1);
  });

  it("indexul PostgreSQL refuză o a doua rezervare activă chiar la scriere directă", async () => {
    await book().expect(201);
    const existing = await prisma.reservation.findFirstOrThrow();
    const { id, createdAt, ...data } = existing;
    await expect(prisma.reservation.create({ data: { ...data, playerId: otherPlayer.id } })).rejects.toMatchObject({ code: "P2002" });
    expect(await prisma.reservation.count()).toBe(1);
  });

  it("nu creează rezervarea dacă notificarea nu se poate salva", async () => {
    await prisma.$executeRawUnsafe('ALTER TABLE notifications ADD CONSTRAINT test_reject_notification CHECK (false) NOT VALID');
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await book().expect(500);
      expect(await prisma.reservation.count()).toBe(0);
      expect(await prisma.notification.count()).toBe(0);
    } finally {
      log.mockRestore();
      await prisma.$executeRawUnsafe('ALTER TABLE notifications DROP CONSTRAINT test_reject_notification');
    }
    expect((await available().expect(200)).body.intervals).toHaveLength(1);
  });

  it("refuză versiunea veche după editarea intervalului", async () => {
    const updated = await edit().expect(200);
    expect(updated.body.interval.version).toBe(2);
    expect((await book().expect(409)).body.error.code).toBe("INTERVAL_CHANGED");
    await book(player, intervalId, 2).expect(201);
  });

  it("nu listează și nu rezervă intervale trecute sau ore locale ambigue/inexistente", async () => {
    for (const values of [
      { date: new Date(Date.now() - 86400000), startsAt: 720, endsAt: 780 },
      { date: new Date("2027-03-28T00:00:00Z"), startsAt: 210, endsAt: 240 },
      { date: new Date("2027-10-31T00:00:00Z"), startsAt: 210, endsAt: 240 },
    ]) {
      const day = values.date.toISOString().slice(0, 10);
      await prisma.fieldAvailability.update({ where: { id: intervalId }, data: { ...values, date: new Date(`${day}T00:00:00Z`) } });
      expect((await available(day).expect(200)).body.intervals).toEqual([]);
      expect([400, 409]).toContain((await book()).status);
    }
    expect(await prisma.reservation.count()).toBe(0);
  });

  it("exclude intervalele fără program valid și revalidează la rezervare", async () => {
    await prisma.fieldOperatingHours.update({ where: { fieldId }, data: { opensAt: 900 } });
    expect((await available().expect(200)).body.intervals).toEqual([]);
    expect((await book().expect(409)).body.error.code).toBe("INTERVAL_UNAVAILABLE");
    await prisma.fieldOperatingHours.delete({ where: { fieldId } });
    expect((await available().expect(200)).body.intervals).toEqual([]);
    await book().expect(409);
  });

  it("cere autentificare, rol de jucător, interval și versiune valide", async () => {
    await request(app).post(path("reservations")).send({}).expect(401);
    await book(owner).expect(403);
    await book(player, randomUUID()).expect(404);
    await book(player, intervalId, 1, randomUUID()).expect(404);
    await book(player, "bad-id").expect(400);
    await book(player, intervalId, 0).expect(400);
    await request(app).post(path("reservations")).set("Authorization", player.token)
      .send({ availabilityId: intervalId, expectedVersion: 1, playerId: otherPlayer.id, status: "APPROVED" }).expect(400);
    const organizer = await account("CHAMPIONSHIP_ORGANIZER");
    await book(organizer).expect(201);
  });

  it("nu rezervă intervalul altui teren folosind ID-ul unui teren valid", async () => {
    const otherField = await prisma.teren.create({ data: { adminId: owner.id, nume: "Alt teren", adresa: "București", sector: "SECTOR_2", numarJucatori: 10 } });
    await book(player, intervalId, 1, otherField.id).expect(404);
  });
});

describe("aprobarea administratorului și notificările", () => {
  it("numai proprietarul aprobă; jucătorul primește o notificare și intervalul rămâne ocupat", async () => {
    const { body } = await book().expect(201);
    const id = body.reservation.id;
    await decide(id, "APPROVED", player).expect(403);
    await decide(id, "APPROVED", otherOwner).expect(403);
    await decide(id, "APPROVED", await account("ADMIN")).expect(403);
    const approved = await decide(id).expect(200);
    expect(approved.body.reservation.status).toBe("APPROVED");
    expect(approved.body.reservation.decidedAt).not.toBeNull();
    expect((await inbox(player).expect(200)).body.notifications[0].type).toBe("RESERVATION_APPROVED");
    expect((await available().expect(200)).body.intervals).toEqual([]);
    await book(otherPlayer).expect(409);
    await decide(id).expect(200);
    expect(await prisma.notification.count({ where: { recipientId: player.id } })).toBe(1);
    await decide(id, "REJECTED").expect(409);
  });

  it("respingerea eliberează intervalul și păstrează istoricul", async () => {
    const { body } = await book().expect(201);
    await decide(body.reservation.id, "REJECTED").expect(200);
    expect((await inbox(player).expect(200)).body.notifications[0].type).toBe("RESERVATION_REJECTED");
    expect((await available().expect(200)).body.intervals).toHaveLength(1);
    await book(otherPlayer).expect(201);
    expect(await prisma.reservation.count()).toBe(2);
    await decide(body.reservation.id, "APPROVED").expect(409);
  });

  it("deciziile simultane opuse nu se suprascriu", async () => {
    const { body } = await book().expect(201);
    const responses = await Promise.all([decide(body.reservation.id), decide(body.reservation.id, "REJECTED")]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.notification.count({ where: { recipientId: player.id } })).toBe(1);
  });

  it("repetarea simultană a aprobării este idempotentă", async () => {
    const { body } = await book().expect(201);
    const responses = await Promise.all([decide(body.reservation.id), decide(body.reservation.id)]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(await prisma.notification.count({ where: { recipientId: player.id } })).toBe(1);
  });

  it("nu aprobă după început; validează ID-uri și decizii", async () => {
    const { body } = await book().expect(201);
    await prisma.reservation.update({ where: { id: body.reservation.id }, data: { startsAtUtc: new Date(Date.now() - 60000) } });
    expect((await decide(body.reservation.id).expect(409)).body.error.code).toBe("INTERVAL_STARTED");
    await decide(body.reservation.id, "PENDING").expect(400);
    await decide("invalid").expect(400);
    await decide(randomUUID()).expect(404);
    await decide(body.reservation.id, "REJECTED").expect(200);
  });

  it("decizia este anulată dacă notificarea către jucător eșuează", async () => {
    const { body } = await book().expect(201);
    await prisma.$executeRawUnsafe('ALTER TABLE notifications ADD CONSTRAINT test_reject_notification CHECK (false) NOT VALID');
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await decide(body.reservation.id).expect(500);
      expect((await prisma.reservation.findUniqueOrThrow({ where: { id: body.reservation.id } })).status).toBe("PENDING");
    } finally {
      log.mockRestore();
      await prisma.$executeRawUnsafe('ALTER TABLE notifications DROP CONSTRAINT test_reject_notification');
    }
  });

  it("inbox-ul este privat, paginat și marcarea ca citit este idempotentă", async () => {
    await book().expect(201);
    const notifications = await inbox(owner, "?unreadOnly=true&pageSize=1").expect(200);
    const id = notifications.body.notifications[0].id;
    await request(app).patch(`/api/notifications/${id}/read`).set("Authorization", otherOwner.token).expect(404);
    await request(app).patch(`/api/notifications/${id}/read`).expect(401);
    await request(app).patch(`/api/notifications/${id}/read`).set("Authorization", owner.token).expect(204);
    const first = await prisma.notification.findUniqueOrThrow({ where: { id } });
    await request(app).patch(`/api/notifications/${id}/read`).set("Authorization", owner.token).expect(204);
    expect((await prisma.notification.findUniqueOrThrow({ where: { id } })).readAt).toEqual(first.readAt);
    const unread = await inbox(owner, "?unreadOnly=true").expect(200);
    expect(unread.body.unreadCount).toBe(0); expect(unread.body.notifications).toEqual([]);
    expect((await inbox().expect(200)).body.notifications).toHaveLength(1);
    await inbox(owner, "?unreadOnly=yes").expect(400);
    await inbox(owner, "?pageSize=101").expect(400);
    await request(app).patch('/api/notifications/invalid/read').set("Authorization", owner.token).expect(400);
  });
});

describe("integrarea rezervărilor cu programul și accesul la liste", () => {
  it("nu permite editarea/ștergerea unui interval ținut sau aprobat", async () => {
    const { body } = await book().expect(201);
    expect((await edit().expect(409)).body.error.code).toBe("INTERVAL_HAS_RESERVATION");
    await remove().expect(409);
    await decide(body.reservation.id).expect(200);
    await edit().expect(409); await remove().expect(409);
    await request(app).put(path("operating-hours")).set("Authorization", owner.token).send({ opensAt: "14:00", closesAt: "23:00" }).expect(409);
    await request(app).delete(path("operating-hours")).set("Authorization", owner.token).expect(409);
  });

  it("după respingere intervalul se poate edita/șterge fără a pierde istoricul rezervării", async () => {
    const { body } = await book().expect(201);
    await decide(body.reservation.id, "REJECTED").expect(200);
    await edit().expect(200); await remove().expect(204);
    const history = await prisma.reservation.findUniqueOrThrow({ where: { id: body.reservation.id } });
    expect(history.availabilityId).toBeNull(); expect(history.startsAt).toBe(720); expect(history.status).toBe("REJECTED");
  });

  it("editarea simultană nu poate schimba intervalul unei rezervări reușite", async () => {
    const responses = await Promise.all([book(), edit()]);
    expect(responses.filter((r) => r.status < 300)).toHaveLength(1);
    expect(responses.filter((r) => r.status === 409)).toHaveLength(1);
    const reservation = await prisma.reservation.findFirst();
    const current = await prisma.fieldAvailability.findUniqueOrThrow({ where: { id: intervalId } });
    if (reservation) expect(reservation.startsAt).toBe(current.startsAt);
  });

  it("ștergerea simultană nu poate șterge o rezervare reușită", async () => {
    const responses = await Promise.all([book(), remove()]);
    expect(responses.filter((r) => r.status < 300)).toHaveLength(1);
    expect(responses.some((r) => r.status === 404 || r.status === 409)).toBe(true);
    if (await prisma.reservation.count()) expect(await prisma.fieldAvailability.count()).toBe(1);
  });

  it("listează doar rezervările proprii sau ale terenului administrat", async () => {
    const { body } = await book().expect(201);
    const mine = await request(app).get(`/api/reservations?status=PENDING&date=${date}`).set("Authorization", player.token).expect(200);
    expect(mine.body.reservations[0].id).toBe(body.reservation.id);
    expect(JSON.stringify(mine.body)).not.toMatch(/passwordHash|tokenHash|email|phoneNumber|dateOfBirth/);
    const theirs = await request(app).get('/api/reservations').set("Authorization", otherPlayer.token).expect(200);
    expect(theirs.body.reservations).toEqual([]);
    const managed = await request(app).get(path(`reservations?date=${date}`)).set("Authorization", owner.token).expect(200);
    expect(managed.body.reservations[0].player.id).toBe(player.id);
    await request(app).get(path('reservations')).set("Authorization", otherOwner.token).expect(403);
    await request(app).get(path('reservations')).set("Authorization", player.token).expect(403);
    await request(app).get('/api/reservations').expect(401);
    await request(app).get('/api/reservations?pageSize=101').set("Authorization", player.token).expect(400);
    await request(app).get('/api/reservations?playerId=forged').set("Authorization", player.token).expect(400);
  });
});
