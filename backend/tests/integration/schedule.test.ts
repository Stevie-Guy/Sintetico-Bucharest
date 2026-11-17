import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import type { UserRole } from "../../src/generated/prisma/enums";
import { generateSessionToken } from "../../src/modules/auth/session-token";

const app = createApp();
const date = "2027-05-20";
const hours = { opensAt: "12:00", closesAt: "23:00" };
const slot = { date, startsAt: "13:00", endsAt: "14:00" };
type Account = { id: string; authorization: string };
let owner: Account;
let outsider: Account;
let player: Account;
let fieldId: string;

async function account(role: UserRole): Promise<Account> {
  const user = await prisma.user.create({ data: { email: `${randomUUID()}@example.com`, passwordHash: "unused", role } });
  const { token, tokenHash } = generateSessionToken();
  await prisma.session.create({ data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 3600000) } });
  return { id: user.id, authorization: `Bearer ${token}` };
}

async function field(adminId: string) {
  return prisma.teren.create({ data: { adminId, nume: "Teren test", adresa: "București", sector: "SECTOR_1", numarJucatori: 10 } });
}

function path(suffix: string, id = fieldId) { return `/api/terenuri/${id}/${suffix}`; }
function setHours(body: object = hours, user = owner) {
  return request(app).put(path("operating-hours")).set("Authorization", user.authorization).send(body);
}
function addSlot(body: object = slot, user = owner) {
  return request(app).post(path("availability")).set("Authorization", user.authorization).send(body);
}
function editSlot(id: string, body: object = slot, user = owner) {
  return request(app).put(path(`availability/${id}`)).set("Authorization", user.authorization).send(body);
}
function removeSlot(id: string, user = owner) {
  return request(app).delete(path(`availability/${id}`)).set("Authorization", user.authorization);
}

beforeEach(async () => {
  await prisma.user.deleteMany();
  owner = await account("FIELD_ADMIN"); outsider = await account("FIELD_ADMIN"); player = await account("PLAYER");
  fieldId = (await field(owner.id)).id;
});

afterAll(async () => { await prisma.user.deleteMany(); await prisma.$disconnect(); });

describe("CRUD program și intervale", () => {
  it("returnează program null și listă goală pentru un teren neconfigurat", async () => {
    const response = await request(app).get(path("operating-hours")).set("Authorization", player.authorization).expect(200);
    expect(response.body.operatingHours).toBeNull();
    const list = await request(app).get(path(`availability?date=${date}`)).set("Authorization", player.authorization).expect(200);
    expect(list.body.intervals).toEqual([]);
    expect((await addSlot().expect(409)).body.error.code).toBe("HOURS_NOT_SET");
  });

  it("creează/citește/modifică/șterge programul și intervalele", async () => {
    const created = await setHours().expect(200);
    expect(created.body.operatingHours).toMatchObject({ ...hours, fieldId, timeZone: "Europe/Bucharest" });
    const response = await addSlot().expect(201);
    const id = response.body.interval.id;
    expect(response.body.interval).toMatchObject({ ...slot, fieldId, timeZone: "Europe/Bucharest" });
    expect(await prisma.fieldAvailability.count()).toBe(1);
    await editSlot(id, { date, startsAt: "14:00", endsAt: "15:00" }).expect(200);
    const list = await request(app).get(path(`availability?date=${date}`)).set("Authorization", player.authorization).expect(200);
    expect(list.body.intervals).toEqual([expect.objectContaining({ id, startsAt: "14:00", endsAt: "15:00" })]);
    expect(JSON.stringify(list.body)).not.toMatch(/password|email|tokenHash|adminId/);
    await setHours({ opensAt: "13:00", closesAt: "20:00" }).expect(200);
    await removeSlot(id).expect(204);
    await request(app).delete(path("operating-hours")).set("Authorization", owner.authorization).expect(204);
    expect(await prisma.fieldOperatingHours.count()).toBe(0);
    expect(await prisma.fieldAvailability.count()).toBe(0);
  });

  it("acceptă marginile programului, dar respinge intervalele din afară la creare și editare", async () => {
    await setHours().expect(200);
    for (const invalid of [{ date, startsAt: "11:59", endsAt: "13:00" }, { date, startsAt: "22:00", endsAt: "23:01" }]) {
      const response = await addSlot(invalid).expect(400);
      expect(response.body.error.code).toBe("OUTSIDE_OPERATING_HOURS");
      expect(response.body.error.message).toContain("modifică programul");
    }
    const { body } = await addSlot({ date, startsAt: "12:00", endsAt: "23:00" }).expect(201);
    await editSlot(body.interval.id, { date, startsAt: "11:00", endsAt: "23:00" }).expect(400);
    const saved = await prisma.fieldAvailability.findUniqueOrThrow({ where: { id: body.interval.id } });
    expect(saved.startsAt).toBe(720);
  });

  it("acceptă un program de 24 ore fără conversii UTC ale orelor locale", async () => {
    await setHours({ opensAt: "00:00", closesAt: "24:00" }).expect(200);
    const response = await addSlot({ date: "2027-03-28", startsAt: "23:00", endsAt: "24:00" }).expect(201);
    expect(response.body.interval).toMatchObject({ date: "2027-03-28", startsAt: "23:00", endsAt: "24:00" });
  });

  it("refuză suprapunerea/duplicatul; acceptă intervale adiacente și aceeași oră în altă zi", async () => {
    await setHours().expect(200);
    const first = await addSlot().expect(201);
    for (const input of [slot, { date, startsAt: "12:00", endsAt: "15:00" }, { date, startsAt: "13:30", endsAt: "14:30" }]) {
      expect((await addSlot(input).expect(409)).body.error.code).toBe("INTERVAL_OVERLAP");
    }
    const second = await addSlot({ date, startsAt: "14:00", endsAt: "15:00" }).expect(201);
    await addSlot({ ...slot, date: "2027-05-21" }).expect(201);
    await editSlot(first.body.interval.id).expect(200); // Actualizarea identică nu se suprapune cu sine.
    await editSlot(second.body.interval.id, { date, startsAt: "13:30", endsAt: "15:00" }).expect(409);
    const list = await request(app).get(path(`availability?date=${date}`)).set("Authorization", player.authorization).expect(200);
    expect(list.body.intervals.map((item: { startsAt: string }) => item.startsAt)).toEqual(["13:00", "14:00"]);
  });

  it("respinge micșorarea/ștergerea programului care ar invalida intervalele existente", async () => {
    await setHours().expect(200);
    await addSlot().expect(201);
    expect((await setHours({ opensAt: "14:00", closesAt: "23:00" }).expect(409)).body.error.code).toBe("HOURS_CONFLICT");
    await setHours({ opensAt: "12:00", closesAt: "13:30" }).expect(409);
    await request(app).delete(path("operating-hours")).set("Authorization", owner.authorization).expect(409);
    const current = await prisma.fieldOperatingHours.findUniqueOrThrow({ where: { fieldId } });
    expect(current.opensAt).toBe(720); expect(current.closesAt).toBe(1380);
  });

  it("permite mutarea unui interval pe altă dată și filtrează după teren", async () => {
    await setHours().expect(200);
    const { body } = await addSlot().expect(201);
    await editSlot(body.interval.id, { ...slot, date: "2027-05-22" }).expect(200);
    const old = await request(app).get(path(`availability?date=${date}`)).set("Authorization", player.authorization).expect(200);
    expect(old.body.intervals).toEqual([]);
    const otherField = await field(owner.id);
    const otherList = await request(app).get(path("availability?date=2027-05-22", otherField.id)).set("Authorization", player.authorization).expect(200);
    expect(otherList.body.intervals).toEqual([]);
  });
});

describe("autorizare și validare", () => {
  it("toate operațiile cer autentificare", async () => {
    for (const [method, suffix, body] of [
      ["get", "operating-hours", undefined], ["put", "operating-hours", hours], ["delete", "operating-hours", undefined],
      ["get", `availability?date=${date}`, undefined], ["post", "availability", slot],
      ["put", `availability/${randomUUID()}`, slot], ["delete", `availability/${randomUUID()}`, undefined],
    ] as const) await request(app)[method](path(suffix)).send(body).expect(401);
  });

  it("numai proprietarul poate scrie, nici alt FIELD_ADMIN și nici ADMIN global", async () => {
    await setHours().expect(200);
    const { body } = await addSlot().expect(201);
    for (const user of [outsider, player, await account("CHAMPIONSHIP_ORGANIZER"), await account("ADMIN")]) {
      await setHours(hours, user).expect(403);
      await addSlot({ date, startsAt: "15:00", endsAt: "16:00" }, user).expect(403);
      await editSlot(body.interval.id, slot, user).expect(403);
      await removeSlot(body.interval.id, user).expect(403);
      await request(app).delete(path("operating-hours")).set("Authorization", user.authorization).expect(403);
    }
    expect(await prisma.fieldAvailability.count()).toBe(1);
  });

  it("verifică asocierea intervalului cu terenul inclusiv pentru același proprietar", async () => {
    await setHours().expect(200);
    const { body } = await addSlot().expect(201);
    const second = await field(owner.id);
    await request(app).put(path(`availability/${body.interval.id}`, second.id)).set("Authorization", owner.authorization).send(slot).expect(404);
    await request(app).delete(path(`availability/${body.interval.id}`, second.id)).set("Authorization", owner.authorization).expect(404);
    await editSlot(randomUUID()).expect(404);
    await removeSlot(randomUUID()).expect(404);
    expect(await prisma.fieldAvailability.count()).toBe(1);
  });

  it("respinge UUID-uri, ore, date și corpuri invalide cu 400", async () => {
    await setHours().expect(200);
    await setHours({ opensAt: "23:00", closesAt: "12:00" }).expect(400);
    await setHours({ ...hours, adminId: outsider.id }).expect(400);
    await addSlot({ ...slot, date: "2027-02-29" }).expect(400);
    await addSlot({ ...slot, startsAt: "14:00" }).expect(400);
    await addSlot({ ...slot, fieldId: randomUUID() }).expect(400);
    await editSlot("invalid").expect(400);
    await removeSlot("invalid").expect(400);
    await request(app).get(path("availability")).set("Authorization", player.authorization).expect(400);
    await request(app).get(path("availability?date=2027-02-29")).set("Authorization", player.authorization).expect(400);
    await request(app).get(path("operating-hours", "invalid")).set("Authorization", player.authorization).expect(400);
    await request(app).get(path("operating-hours", randomUUID())).set("Authorization", player.authorization).expect(404);
    await request(app).put(path("operating-hours", randomUUID())).set("Authorization", owner.authorization).send(hours).expect(404);
    expect(await prisma.fieldAvailability.count()).toBe(0);
  });
});

describe("consistență la cereri simultane", () => {
  it("baza de date refuză intervale negative sau de lungime zero", async () => {
    await expect(prisma.fieldOperatingHours.create({ data: { fieldId, opensAt: 600, closesAt: 600 } })).rejects.toThrow();
    await expect(prisma.fieldAvailability.create({ data: {
      fieldId, date: new Date(`${date}T00:00:00Z`), startsAt: -1, endsAt: 60,
    } })).rejects.toThrow();
  });

  it("creează doar unul dintre două intervale suprapuse simultane", async () => {
    await setHours().expect(200);
    const responses = await Promise.all([addSlot(), addSlot({ date, startsAt: "13:30", endsAt: "14:30" })]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(await prisma.fieldAvailability.count()).toBe(1);
  });

  it("nu permite unei modificări concurente a programului să lase intervale în afară", async () => {
    await setHours().expect(200);
    const responses = await Promise.all([
      setHours({ opensAt: "14:00", closesAt: "23:00" }), addSlot(),
    ]);
    const current = await prisma.fieldOperatingHours.findUniqueOrThrow({ where: { fieldId } });
    const intervals = await prisma.fieldAvailability.findMany({ where: { fieldId } });
    for (const interval of intervals) {
      expect(interval.startsAt).toBeGreaterThanOrEqual(current.opensAt);
      expect(interval.endsAt).toBeLessThanOrEqual(current.closesAt);
    }
    expect(responses.filter((response) => response.status < 300)).toHaveLength(1);
    expect(responses.some((response) => response.status === 400 || response.status === 409)).toBe(true);
  });
});
