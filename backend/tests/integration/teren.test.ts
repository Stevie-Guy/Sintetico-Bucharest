import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import type { UserRole } from "../../src/generated/prisma/enums";
import { generateSessionToken } from "../../src/modules/auth/session-token";

const app = createApp();
type Account = { id: string; authorization: string };
let owner: Account;
let outsider: Account;
let player: Account;
let admin: Account;

const valid = { nume: "Sintetic Titan", adresa: "Bd. Nicolae Grigorescu 12", sector: "SECTOR_3", numarJucatori: 10 };

async function account(role: UserRole): Promise<Account> {
  const user = await prisma.user.create({ data: { email: `${randomUUID()}@example.com`, passwordHash: "unused", role, name: "Test", phoneNumber: "+40700000000" } });
  const { token, tokenHash } = generateSessionToken();
  await prisma.session.create({ data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 3600000) } });
  return { id: user.id, authorization: `Bearer ${token}` };
}

function create(body: object = valid, user = owner) {
  return request(app).post("/api/terenuri").set("Authorization", user.authorization).send(body);
}
function edit(id: string, body: object = valid, user = owner) {
  return request(app).put(`/api/terenuri/${id}`).set("Authorization", user.authorization).send(body);
}

beforeEach(async () => {
  await prisma.user.deleteMany();
  owner = await account("FIELD_ADMIN"); outsider = await account("FIELD_ADMIN");
  player = await account("PLAYER"); admin = await account("ADMIN");
});

afterAll(async () => { await prisma.user.deleteMany(); await prisma.$disconnect(); });

describe("POST /api/terenuri", () => {
  it("creează terenul cu proprietarul din sesiune, iar terenul apare în listă și la detaliu", async () => {
    const response = await create({ ...valid, nume: "  Sintetic Titan  " }).expect(201);
    expect(response.body.field).toMatchObject({ ...valid, adminId: owner.id });

    const list = await request(app).get("/api/terenuri").set("Authorization", player.authorization).expect(200);
    expect(list.body).toMatchObject({ page: 1, pageSize: 20, hasMore: false });
    expect(list.body.fields.map((field: { id: string }) => field.id)).toEqual([response.body.field.id]);

    const detail = await request(app).get(`/api/terenuri/${response.body.field.id}`).set("Authorization", player.authorization).expect(200);
    expect(detail.body.field).toEqual(response.body.field);
  });

  it("cere autentificare", async () => {
    const response = await request(app).post("/api/terenuri").send(valid).expect(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("refuză jucătorii", async () => {
    expect((await create(valid, player).expect(403)).body.error.code).toBe("FORBIDDEN");
    expect(await prisma.teren.count()).toBe(0);
  });

  it("permite Administratorului, care devine proprietar", async () => {
    expect((await create(valid, admin).expect(201)).body.field.adminId).toBe(admin.id);
  });

  it("validează datele și răspunde cu erorile pe câmpuri", async () => {
    const response = await create({ ...valid, sector: "SECTOR_9", numarJucatori: "abc" }).expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(response.body.error.fields).sort()).toEqual(["numarJucatori", "sector"]);
    expect(await prisma.teren.count()).toBe(0);
  });

  it("nu acceptă alt proprietar trimis în corp", async () => {
    const response = await create({ ...valid, adminId: outsider.id }).expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("PUT /api/terenuri/:id", () => {
  let fieldId: string;
  beforeEach(async () => { fieldId = (await create().expect(201)).body.field.id; });

  it("proprietarul înlocuiește datele terenului", async () => {
    const changes = { nume: "Titan Arena", adresa: "Str. Liviu Rebreanu 4", sector: "SECTOR_2", numarJucatori: 14 };
    const response = await edit(fieldId, changes).expect(200);
    expect(response.body.field).toMatchObject({ id: fieldId, ...changes, adminId: owner.id });
    expect(await prisma.teren.findUnique({ where: { id: fieldId } })).toMatchObject(changes);
  });

  it("un alt administrator de teren nu îl poate edita", async () => {
    expect((await edit(fieldId, { ...valid, nume: "Furat" }, outsider).expect(403)).body.error.code).toBe("FIELD_NOT_OWNED");
    expect((await prisma.teren.findUniqueOrThrow({ where: { id: fieldId } })).nume).toBe(valid.nume);
  });

  it("jucătorii primesc FORBIDDEN", async () => {
    expect((await edit(fieldId, valid, player).expect(403)).body.error.code).toBe("FORBIDDEN");
  });

  it("cere toate câmpurile valide", async () => {
    const response = await edit(fieldId, { nume: "Doar numele" }).expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(response.body.error.fields).sort()).toEqual(["adresa", "numarJucatori", "sector"]);
  });

  it("răspunde 404 pentru un teren inexistent și 400 pentru un id invalid", async () => {
    expect((await edit(randomUUID()).expect(404)).body.error.code).toBe("FIELD_NOT_FOUND");
    expect((await edit("nu-e-uuid").expect(400)).body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/terenuri", () => {
  it("filtrează după sector și paginează în ordinea numelui", async () => {
    await create({ ...valid, nume: "Charlie", sector: "SECTOR_1" }).expect(201);
    await create({ ...valid, nume: "Alpha", sector: "SECTOR_1" }).expect(201);
    await create({ ...valid, nume: "Bravo", sector: "SECTOR_2" }).expect(201);

    const firstPage = await request(app).get("/api/terenuri?sector=SECTOR_1&pageSize=1").set("Authorization", player.authorization).expect(200);
    expect(firstPage.body.fields.map((field: { nume: string }) => field.nume)).toEqual(["Alpha"]);
    expect(firstPage.body.hasMore).toBe(true);

    const secondPage = await request(app).get("/api/terenuri?sector=SECTOR_1&pageSize=1&page=2").set("Authorization", player.authorization).expect(200);
    expect(secondPage.body.fields.map((field: { nume: string }) => field.nume)).toEqual(["Charlie"]);
    expect(secondPage.body.hasMore).toBe(false);
  });

  it("refuză filtrele invalide și cererile neautentificate", async () => {
    expect((await request(app).get("/api/terenuri?sector=SECTOR_9").set("Authorization", player.authorization).expect(400)).body.error.code).toBe("VALIDATION_ERROR");
    await request(app).get("/api/terenuri").expect(401);
  });

  it("răspunde 404 la detaliul unui teren inexistent", async () => {
    const response = await request(app).get(`/api/terenuri/${randomUUID()}`).set("Authorization", player.authorization).expect(404);
    expect(response.body.error.code).toBe("FIELD_NOT_FOUND");
  });
});
