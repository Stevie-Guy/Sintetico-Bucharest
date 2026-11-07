import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { hashSessionToken } from "../../src/modules/auth/session-token";

const app = createApp();
const account = { email: "jucator@example.com", password: "Sintetic0!", role: "PLAYER" };

async function login(email = account.email, password = account.password) {
  return request(app).post("/api/auth/login").send({ email, password });
}

beforeEach(async () => {
  await prisma.user.deleteMany();
  await request(app).post("/api/auth/register").send(account).expect(201);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/auth/login (US-02)", () => {
  it("cu date corecte întoarce token-ul, data expirării și utilizatorul", async () => {
    const res = await login();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      token: expect.any(String),
      expiresAt: expect.any(String),
      user: { id: expect.any(String), email: account.email, role: "PLAYER", createdAt: expect.any(String) },
    });
  });

  it("sesiunea expiră după 7 zile (implicit)", async () => {
    const before = Date.now();
    const res = await login();

    const ttl = new Date(res.body.expiresAt).getTime() - before;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(ttl).toBeGreaterThanOrEqual(sevenDays - 5000);
    expect(ttl).toBeLessThanOrEqual(sevenDays + 5000);
  });

  it("salvează în baza de date doar hash-ul token-ului", async () => {
    const { body } = await login();

    const sessions = await prisma.session.findMany();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).toBe(hashSessionToken(body.token));
    expect(sessions[0].tokenHash).not.toBe(body.token);
  });

  it("acceptă emailul scris cu majuscule și spații", async () => {
    const res = await login("  JUCATOR@Example.com ");
    expect(res.status).toBe(200);
  });

  it("refuză parola greșită", async () => {
    const res = await login(account.email, "Gresit0!");

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: "INVALID_CREDENTIALS", message: "Email sau parolă greșită." });
    expect(await prisma.session.count()).toBe(0);
  });

  it("dă același răspuns pentru un email fără cont", async () => {
    const res = await login("nimeni@example.com");

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: "INVALID_CREDENTIALS", message: "Email sau parolă greșită." });
  });

  it("cere email și parolă", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields).sort()).toEqual(["email", "password"]);
  });

  it("permite mai multe sesiuni simultane (ex. telefon și calculator)", async () => {
    const a = await login();
    const b = await login();

    expect(a.body.token).not.toBe(b.body.token);
    expect(await prisma.session.count()).toBe(2);
  });
});

describe("GET /api/auth/me (US-02)", () => {
  it("cu token valid întoarce contul", async () => {
    const { body } = await login();

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(body.user);
  });

  it("fără token răspunde cu 401", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("cu un token inventat răspunde cu 401", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer token-inventat");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("cu un token expirat răspunde cu 401 și șterge sesiunea", async () => {
    const { body } = await login();
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${body.token}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({
      code: "SESSION_EXPIRED",
      message: "Sesiunea a expirat. Autentifică-te din nou.",
    });
    expect(await prisma.session.count()).toBe(0);
  });
});

describe("POST /api/auth/logout (US-02)", () => {
  it("deconectează: token-ul nu mai poate fi folosit", async () => {
    const { body } = await login();
    const auth = `Bearer ${body.token}`;

    await request(app).post("/api/auth/logout").set("Authorization", auth).expect(204);

    const res = await request(app).get("/api/auth/me").set("Authorization", auth);
    expect(res.status).toBe(401);
  });

  it("închide doar sesiunea curentă, nu și pe celelalte", async () => {
    const phone = await login();
    const desktop = await login();

    await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${phone.body.token}`).expect(204);

    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${desktop.body.token}`).expect(200);
  });

  it("fără token răspunde cu 401", async () => {
    await request(app).post("/api/auth/logout").expect(401);
  });
});
