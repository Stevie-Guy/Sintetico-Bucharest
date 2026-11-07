import { hasRole } from "../../src/modules/auth/roles";

describe("hasRole", () => {
  it.each(["PLAYER", "FIELD_ADMIN", "CHAMPIONSHIP_ORGANIZER"] as const)("acceptă rolul cerut %s", (role) => {
    expect(hasRole(role, [role])).toBe(true);
  });

  it("refuză un rol care nu e în listă", () => {
    expect(hasRole("PLAYER", ["FIELD_ADMIN"])).toBe(false);
    expect(hasRole("FIELD_ADMIN", ["PLAYER", "CHAMPIONSHIP_ORGANIZER"])).toBe(false);
  });

  it("organizatorul are și drepturile unui jucător", () => {
    expect(hasRole("CHAMPIONSHIP_ORGANIZER", ["PLAYER"])).toBe(true);
  });

  it("jucătorul nu are drepturile organizatorului", () => {
    expect(hasRole("PLAYER", ["CHAMPIONSHIP_ORGANIZER"])).toBe(false);
  });

  it.each([["PLAYER"], ["FIELD_ADMIN"], ["CHAMPIONSHIP_ORGANIZER"], ["ADMIN"]] as const)(
    "adminul are drepturile rolului %s",
    (role) => {
      expect(hasRole("ADMIN", [role])).toBe(true);
    },
  );

  it("doar adminul trece de o verificare ADMIN", () => {
    expect(hasRole("FIELD_ADMIN", ["ADMIN"])).toBe(false);
    expect(hasRole("CHAMPIONSHIP_ORGANIZER", ["ADMIN"])).toBe(false);
  });
});
