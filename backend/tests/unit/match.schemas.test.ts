import { createMatchSchema, joinMatchSchema, matchPaginationSchema } from "../../src/modules/matches/match.schemas";

const valid = {
  reservationId: "5977cf9a-1c01-47d3-95e3-f8f72d5ec077", startsAt: "2027-06-05T12:00:00+03:00",
  maxPlayers: 10, ageCategory: "SENIOR",
};

describe("validarea datelor pentru meciuri", () => {
  it("transformă data cu offset în instant UTC", () => {
    expect(createMatchSchema.parse(valid).startsAt).toEqual(new Date("2027-06-05T09:00:00Z"));
  });
  it.each(["U12", "U15", "U18", "SENIOR", "VETERANS_35_PLUS"])("acceptă categoria %s", (ageCategory) => {
    expect(createMatchSchema.safeParse({ ...valid, ageCategory }).success).toBe(true);
  });
  it.each([
    {}, { ...valid, reservationId: "bad" }, { ...valid, reservationId: undefined },
    { ...valid, startsAt: "2027-06-05T12:00:00" }, { ...valid, startsAt: "2027-02-29T12:00:00Z" },
    { ...valid, startsAt: "12:00" }, { ...valid, startsAt: undefined },
    { ...valid, maxPlayers: 0 }, { ...valid, maxPlayers: -1 }, { ...valid, maxPlayers: 2.5 },
    { ...valid, maxPlayers: "10" }, { ...valid, maxPlayers: 2147483648 }, { ...valid, maxPlayers: undefined },
    { ...valid, ageCategory: "invalid" }, { ...valid, ageCategory: undefined },
    { ...valid, creatorId: valid.reservationId }, { ...valid, fieldId: valid.reservationId },
    { ...valid, endsAt: valid.startsAt }, { ...valid, participantCount: 0 },
  ])("refuză datele invalide sau câmpurile controlate de server %o", (input) => {
    expect(createMatchSchema.safeParse(input).success).toBe(false);
  });
  it("înscrierea nu acceptă identitatea altui jucător sau alte câmpuri", () => {
    expect(joinMatchSchema.parse(undefined)).toEqual({});
    expect(joinMatchSchema.parse({})).toEqual({});
    expect(joinMatchSchema.safeParse({ userId: valid.reservationId }).success).toBe(false);
  });
  it("pagina are valori implicite și limite", () => {
    expect(matchPaginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(matchPaginationSchema.parse({ page: "2", pageSize: "1" })).toEqual({ page: 2, pageSize: 1 });
    for (const input of [{ page: 0 }, { page: 1000001 }, { pageSize: 101 }, { pageSize: 0 }, { userId: "x" }]) {
      expect(matchPaginationSchema.safeParse(input).success).toBe(false);
    }
  });
});
