import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { verifyPassword } from "../../src/modules/auth/password-hasher";

const app = createApp();
const valid = { email: "jucator@example.com", password: "Sintetic0!", role: "PLAYER" };

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/auth/register (US-01)", () => {
  it("creează contul și întoarce utilizatorul fără parolă", async () => {
    const res = await request(app).post("/api/auth/register").send(valid);

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({
      id: expect.any(String),
      email: "jucator@example.com",
      role: "PLAYER",
      createdAt: expect.any(String),
    });
    expect(JSON.stringify(res.body)).not.toContain("Sintetic0!");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("stochează parola hash-uită", async () => {
    await request(app).post("/api/auth/register").send(valid).expect(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: valid.email } });
    expect(user.passwordHash).not.toBe(valid.password);
    await expect(verifyPassword(valid.password, user.passwordHash)).resolves.toBe(true);
  });

  it.each(["PLAYER", "FIELD_ADMIN", "CHAMPIONSHIP_ORGANIZER"])("permite tipul de cont %s", async (role) => {
    const res = await request(app).post("/api/auth/register").send({ ...valid, role });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe(role);
  });

  it("refuză un email deja folosit, cu mesaj clar", async () => {
    await request(app).post("/api/auth/register").send(valid).expect(201);

    const res = await request(app).post("/api/auth/register").send({ ...valid, role: "FIELD_ADMIN" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: "EMAIL_TAKEN",
      message: "Există deja un cont cu acest email.",
    });
    expect(await prisma.user.count()).toBe(1);
  });

  it("consideră același email indiferent de majuscule și spații", async () => {
    await request(app).post("/api/auth/register").send(valid).expect(201);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...valid, email: "  JUCATOR@example.com " });

    expect(res.status).toBe(409);
  });

  it("creează un singur cont la două cereri simultane cu același email", async () => {
    const results = await Promise.all([
      request(app).post("/api/auth/register").send(valid),
      request(app).post("/api/auth/register").send(valid),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await prisma.user.count()).toBe(1);
  });

  it("refuză o parolă slabă și listează regulile încălcate", async () => {
    const res = await request(app).post("/api/auth/register").send({ ...valid, password: "parola" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.fields.password).toEqual([
      "Parola trebuie să aibă cel puțin 8 caractere.",
      "Parola trebuie să conțină cel puțin o literă mare.",
      "Parola trebuie să conțină cel puțin o cifră.",
      "Parola trebuie să conțină cel puțin un caracter special (ex. ! @ # $ %).",
    ]);
    expect(await prisma.user.count()).toBe(0);
  });

  it("refuză un email invalid", async () => {
    const res = await request(app).post("/api/auth/register").send({ ...valid, email: "nu-e-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.email).toEqual(["Adresa de email nu este validă."]);
  });

  it("nu permite crearea unui cont de Administrator", async () => {
    const res = await request(app).post("/api/auth/register").send({ ...valid, role: "ADMIN" });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.role).toBeDefined();
  });

  it("raportează câmpurile lipsă", async () => {
    const res = await request(app).post("/api/auth/register").send({});

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields).sort()).toEqual(["email", "password", "role"]);
  });

  it("răspunde cu 400 la JSON invalid", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Content-Type", "application/json")
      .send("{email:");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});
