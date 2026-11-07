import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();
const allowed = "http://localhost:8081";

describe("CORS", () => {
  it("permite originea aplicației web Expo", async () => {
    const res = await request(app).get("/api/health").set("Origin", allowed);

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(allowed);
  });

  it("răspunde la cererea preliminară (preflight) fără să ajungă la rută", async () => {
    const res = await request(app)
      .options("/api/auth/register")
      .set("Origin", allowed)
      .set("Access-Control-Request-Method", "POST");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
    expect(res.headers["access-control-allow-headers"]).toContain("Content-Type");
  });

  it("nu permite alte origini", async () => {
    const res = await request(app).get("/api/health").set("Origin", "https://site-strain.ro");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
