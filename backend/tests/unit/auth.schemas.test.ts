import { registerSchema } from "../../src/modules/auth/auth.schemas";

const valid = { email: "jucator@example.com", password: "Sintetic0!", role: "PLAYER" };

describe("registerSchema", () => {
  it("acceptă date valide", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("normalizează emailul (spații și majuscule)", () => {
    const result = registerSchema.parse({ ...valid, email: "  Jucator@Example.COM " });
    expect(result.email).toBe("jucator@example.com");
  });

  it.each(["", "fara-arond", "a@", "@example.com", "a b@example.com"])("refuză emailul invalid %p", (email) => {
    expect(registerSchema.safeParse({ ...valid, email }).success).toBe(false);
  });

  it.each(["PLAYER", "FIELD_ADMIN", "CHAMPIONSHIP_ORGANIZER"])("acceptă tipul de cont %s", (role) => {
    expect(registerSchema.safeParse({ ...valid, role }).success).toBe(true);
  });

  it.each(["ADMIN", "player", "", undefined])("refuză tipul de cont %p", (role) => {
    expect(registerSchema.safeParse({ ...valid, role }).success).toBe(false);
  });

  it("raportează regulile de parolă încălcate pe câmpul password", () => {
    const result = registerSchema.safeParse({ ...valid, password: "abc" });
    expect(result.success).toBe(false);
    const messages = result.error!.issues.filter((i) => i.path[0] === "password").map((i) => i.message);
    expect(messages).toHaveLength(4);
  });
});
