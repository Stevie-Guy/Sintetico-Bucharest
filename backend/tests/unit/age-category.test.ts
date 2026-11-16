import { AgeCategory, calculateAgeCategory } from "../../src/modules/profile/age-category";

function utcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

describe("calculateAgeCategory", () => {
  it.each([
    ["2014-06-16", AgeCategory.U12],
    ["2014-06-15", AgeCategory.U15],
    ["2011-06-16", AgeCategory.U15],
    ["2011-06-15", AgeCategory.U18],
    ["2008-06-16", AgeCategory.U18],
    ["2008-06-15", AgeCategory.Seniori],
    ["1991-06-16", AgeCategory.Seniori],
    ["1991-06-15", AgeCategory.Veterani35Plus],
  ] as const)("încadrează data nașterii %s la categoria %s", (dateOfBirth, category) => {
    expect(calculateAgeCategory(utcDate(dateOfBirth), utcDate("2026-06-15"))).toBe(category);
  });

  it("schimbă categoria în chiar ziua împlinirii pragului de vârstă", () => {
    const dateOfBirth = utcDate("2014-06-16");

    expect(calculateAgeCategory(dateOfBirth, utcDate("2026-06-15"))).toBe(AgeCategory.U12);
    expect(calculateAgeCategory(dateOfBirth, utcDate("2026-06-16"))).toBe(AgeCategory.U15);
  });

  it("tratează ziua de 29 februarie ca aniversare pe 1 martie în anii nebisecți", () => {
    const dateOfBirth = utcDate("2008-02-29");

    expect(calculateAgeCategory(dateOfBirth, utcDate("2043-02-28"))).toBe(AgeCategory.Seniori);
    expect(calculateAgeCategory(dateOfBirth, utcDate("2043-03-01"))).toBe(AgeCategory.Veterani35Plus);
  });

  it("refuză date invalide sau viitoare", () => {
    expect(() => calculateAgeCategory(new Date("invalid"), utcDate("2026-06-15"))).toThrow(RangeError);
    expect(() => calculateAgeCategory(utcDate("2026-06-16"), utcDate("2026-06-15"))).toThrow(RangeError);
  });
});
