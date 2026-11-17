import type { MatchAgeCategory } from "../../src/generated/prisma/enums";
import { requireMatchingAge, validateMatchTime } from "../../src/modules/matches/match.rules";

const now = new Date("2026-11-17T10:00:00Z");
const reservation = { startsAtUtc: new Date("2026-11-18T10:00:00Z"), endsAtUtc: new Date("2026-11-18T11:00:00Z") };

describe("ora meciului", () => {
  it("acceptă începutul rezervării și o oră ulterioară în același interval", () => {
    expect(() => validateMatchTime(reservation.startsAtUtc, reservation, now)).not.toThrow();
    expect(() => validateMatchTime(new Date("2026-11-18T10:30:00Z"), reservation, now)).not.toThrow();
  });
  it.each(["2026-11-18T09:59:59Z", "2026-11-18T11:00:00Z", "2026-11-18T11:00:01Z"])("respinge %s în afara rezervării", (value) => {
    expect(() => validateMatchTime(new Date(value), reservation, now)).toThrow(expect.objectContaining({ code: "OUTSIDE_RESERVATION" }));
  });
  it.each(["2026-11-17T09:59:59Z", "2026-11-17T10:00:00Z"])("respinge %s care nu este în viitor", (value) => {
    expect(() => validateMatchTime(new Date(value), reservation, now)).toThrow(expect.objectContaining({ code: "MATCH_IN_PAST" }));
  });
});

describe("categoria participantului", () => {
  it.each<[string, MatchAgeCategory]>([
    ["2014-11-18", "U12"], ["2014-11-17", "U15"], ["2011-11-18", "U15"],
    ["2011-11-17", "U18"], ["2008-11-18", "U18"], ["2008-11-17", "SENIOR"],
    ["1991-11-18", "SENIOR"], ["1991-11-17", "VETERANS_35_PLUS"],
  ])("recalculează pragul din data nașterii %s", (dob, category) => {
    expect(() => requireMatchingAge(new Date(dob), category, now)).not.toThrow();
  });
  it("cere data nașterii și categoria potrivită", () => {
    expect(() => requireMatchingAge(null, "SENIOR", now)).toThrow(expect.objectContaining({ code: "DATE_OF_BIRTH_REQUIRED" }));
    expect(() => requireMatchingAge(new Date("2000-01-01"), "U18", now)).toThrow(expect.objectContaining({ code: "AGE_CATEGORY_MISMATCH" }));
  });
});
