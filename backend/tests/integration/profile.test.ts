import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";

const app = createApp();
const account = { email: "profil@example.com", password: "Sintetic0!", role: "PLAYER" };

async function login() {
  const response = await request(app).post("/api/auth/login").send(account);
  return `Bearer ${response.body.token}`;
}

beforeEach(async () => {
  await prisma.user.deleteMany();
  await request(app).post("/api/auth/register").send(account).expect(201);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("/api/profile (US-03, US-04)", () => {
  it("returnează toate câmpurile profilului după actualizare", async () => {
    const authorization = await login();
    const dateOfBirth = `${new Date().getUTCFullYear() - 28}-01-01`;
    const values = {
      name: "  Alex Popescu  ",
      dateOfBirth,
      preferredPosition: "MIJLOCAS",
      dominantFoot: "DREAPTA",
      phoneNumber: "+40712345678",
    };

    const update = await request(app)
      .patch("/api/profile")
      .set("Authorization", authorization)
      .send(values)
      .expect(200);

    expect(update.body.user).toMatchObject({
      email: account.email,
      name: "Alex Popescu",
      dateOfBirth: `${dateOfBirth}T00:00:00.000Z`,
      preferredPosition: "MIJLOCAS",
      dominantFoot: "DREAPTA",
      phoneNumber: "+40712345678",
    });
    expect(update.body.user.ageCategory).toBe("Seniori");

    const profile = await request(app).get("/api/profile").set("Authorization", authorization).expect(200);
    expect(profile.body.user).toMatchObject(update.body.user);
    expect(profile.body.user).toHaveProperty("id");
    expect(profile.body.user).toHaveProperty("createdAt");
    expect(profile.body.user).toHaveProperty("updatedAt");
  });

  it("acceptă piciorul dominant AMBIDEXTRU", async () => {
    const authorization = await login();

    const update = await request(app)
      .patch("/api/profile")
      .set("Authorization", authorization)
      .send({ dominantFoot: "AMBIDEXTRU" })
      .expect(200);

    expect(update.body.user.dominantFoot).toBe("AMBIDEXTRU");
  });

  it("permite actualizarea parțială și ștergerea unui câmp opțional", async () => {
    const authorization = await login();

    await request(app)
      .patch("/api/profile")
      .set("Authorization", authorization)
      .send({ name: "Alex Popescu", phoneNumber: "+40712345678" })
      .expect(200);

    const update = await request(app)
      .patch("/api/profile")
      .set("Authorization", authorization)
      .send({ phoneNumber: null })
      .expect(200);

    expect(update.body.user.name).toBe("Alex Popescu");
    expect(update.body.user.phoneNumber).toBeNull();
  });

  it("calculează categoria din data nașterii și o recalculează după modificare", async () => {
    const authorization = await login();
    const emptyProfile = await request(app).get("/api/profile").set("Authorization", authorization).expect(200);
    expect(emptyProfile.body.user.ageCategory).toBeNull();

    const birthYear = new Date().getUTCFullYear() - 35;
    const update = await request(app)
      .patch("/api/profile")
      .set("Authorization", authorization)
      .send({ dateOfBirth: `${birthYear}-01-01` })
      .expect(200);
    expect(update.body.user.ageCategory).toBe("Veterani 35+");

    const cleared = await request(app)
      .patch("/api/profile")
      .set("Authorization", authorization)
      .send({ dateOfBirth: null })
      .expect(200);
    expect(cleared.body.user.ageCategory).toBeNull();
  });

  it.each([
    [{ name: "x".repeat(129) }, "name"],
    [{ dateOfBirth: "2999-01-01" }, "dateOfBirth"],
    [{ dateOfBirth: "2023-02-29" }, "dateOfBirth"],
    [{ preferredPosition: "CAPITAN" }, "preferredPosition"],
    [{ dominantFoot: "AMBELE" }, "dominantFoot"],
    [{ phoneNumber: "0712345678" }, "phoneNumber"],
    [{ phoneNumber: "+4071234567" }, "phoneNumber"],
  ])("refuză date de profil invalide: %o", async (input, field) => {
    const authorization = await login();
    const response = await request(app).patch("/api/profile").set("Authorization", authorization).send(input);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.fields[field]).toBeDefined();
  });

  it("refuză un corp gol și câmpuri care nu fac parte din profil", async () => {
    const authorization = await login();

    await request(app).patch("/api/profile").set("Authorization", authorization).send({}).expect(400);
    await request(app)
      .patch("/api/profile")
      .set("Authorization", authorization)
      .send({ ageCategory: "Seniori" })
      .expect(400);
  });

  it("cere autentificare", async () => {
    await request(app).get("/api/profile").expect(401);
    await request(app).patch("/api/profile").send({ name: "Alex" }).expect(401);
  });
});
