import express from "express";
import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { errorHandler } from "../../src/middleware/error-handler";
import { requireAuth } from "../../src/middleware/require-auth";
import { requireRole } from "../../src/middleware/require-role";
import { upsertAdmin } from "../../src/modules/auth/admin.service";
import { AppError } from "../../src/errors/app-error";

const app = createApp();
const admin = { email: "admin@example.com", password: "Sintetic0!" };

async function tokenFor(email: string, password = admin.password) {
  const res = await request(app).post("/api/auth/login").send({ email, password }).expect(200);
  return res.body.token as string;
}

async function registerAndLogin(email: string, role: string) {
  await request(app).post("/api/auth/register").send({ email, password: admin.password, role }).expect(201);
  return tokenFor(email);
}

// Aplicație de test cu câte o rută pentru fiecare rol, ca să verificăm middleware-ul requireRole.
const guarded = express();
guarded.get("/player", requireAuth, requireRole("PLAYER"), (_req, res) => void res.json({ ok: true }));
guarded.get("/field-admin", requireAuth, requireRole("FIELD_ADMIN"), (_req, res) => void res.json({ ok: true }));
guarded.get("/organizer", requireAuth, requireRole("CHAMPIONSHIP_ORGANIZER"), (_req, res) => void res.json({ ok: true }));
guarded.get("/admin", requireAuth, requireRole("ADMIN"), (_req, res) => void res.json({ ok: true }));
guarded.use(errorHandler);

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("upsertAdmin", () => {
  it("creează contul de Administrator, cu care se poate autentifica", async () => {
    const user = await upsertAdmin(admin);
    expect(user).toMatchObject({ email: admin.email, role: "ADMIN" });

    const res = await request(app).post("/api/auth/login").send(admin);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("ADMIN");
  });

  it("salvează emailul cu litere mici", async () => {
    const user = await upsertAdmin({ email: "  ADMIN@Example.com ", password: admin.password });
    expect(user.email).toBe(admin.email);
  });

  it("transformă un cont existent în Administrator, cu parola nouă, și îi șterge sesiunile", async () => {
    await registerAndLogin(admin.email, "PLAYER");

    const user = await upsertAdmin({ email: admin.email, password: "AltaParola1!" });

    expect(user.role).toBe("ADMIN");
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.session.count()).toBe(0);
    await request(app).post("/api/auth/login").send(admin).expect(401);
    await request(app).post("/api/auth/login").send({ email: admin.email, password: "AltaParola1!" }).expect(200);
  });

  it("refuză o parolă care nu respectă regulile", async () => {
    const attempt = upsertAdmin({ email: admin.email, password: "slaba" });
    await expect(attempt).rejects.toBeInstanceOf(AppError);
    await expect(attempt).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      fields: { password: expect.any(Array) },
    });
    expect(await prisma.user.count()).toBe(0);
  });

  it("refuză un email invalid", async () => {
    await expect(upsertAdmin({ email: "nu-e-email", password: admin.password })).rejects.toMatchObject({
      fields: { email: expect.any(Array) },
    });
  });
});

describe("requireRole", () => {
  it("adminul are acces la rutele tuturor rolurilor", async () => {
    await upsertAdmin(admin);
    const token = await tokenFor(admin.email);

    for (const path of ["/player", "/field-admin", "/organizer", "/admin"]) {
      await request(guarded).get(path).set("Authorization", `Bearer ${token}`).expect(200);
    }
  });

  it("jucătorul are acces doar la rutele de jucător", async () => {
    const token = await registerAndLogin("jucator@example.com", "PLAYER");

    await request(guarded).get("/player").set("Authorization", `Bearer ${token}`).expect(200);
    for (const path of ["/field-admin", "/organizer", "/admin"]) {
      const res = await request(guarded).get(path).set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    }
  });

  it("organizatorul are acces și la rutele de jucător", async () => {
    const token = await registerAndLogin("organizator@example.com", "CHAMPIONSHIP_ORGANIZER");

    await request(guarded).get("/player").set("Authorization", `Bearer ${token}`).expect(200);
    await request(guarded).get("/organizer").set("Authorization", `Bearer ${token}`).expect(200);
    await request(guarded).get("/field-admin").set("Authorization", `Bearer ${token}`).expect(403);
    await request(guarded).get("/admin").set("Authorization", `Bearer ${token}`).expect(403);
  });

  it("fără autentificare răspunde cu 401", async () => {
    await request(guarded).get("/player").expect(401);
  });
});
