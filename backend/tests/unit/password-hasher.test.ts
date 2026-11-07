import { hashPassword, verifyPassword } from "../../src/modules/auth/password-hasher";

describe("password-hasher", () => {
  it("nu păstrează parola în clar în hash", async () => {
    const hash = await hashPassword("Sintetic0!");
    expect(hash).not.toContain("Sintetic0!");
    expect(hash).toMatch(/^scrypt\$\d+\$\d+\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  });

  it("produce hash-uri diferite pentru aceeași parolă (salt aleator)", async () => {
    const [a, b] = await Promise.all([hashPassword("Sintetic0!"), hashPassword("Sintetic0!")]);
    expect(a).not.toEqual(b);
  });

  it("verifică parola corectă", async () => {
    const hash = await hashPassword("Sintetic0!");
    await expect(verifyPassword("Sintetic0!", hash)).resolves.toBe(true);
  });

  it("respinge o parolă greșită", async () => {
    const hash = await hashPassword("Sintetic0!");
    await expect(verifyPassword("sintetic0!", hash)).resolves.toBe(false);
  });

  it("respinge un hash în format necunoscut", async () => {
    await expect(verifyPassword("Sintetic0!", "bcrypt$abc")).resolves.toBe(false);
  });
});
