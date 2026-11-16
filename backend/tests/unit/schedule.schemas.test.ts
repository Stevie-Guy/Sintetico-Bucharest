import { availabilitySchema, operatingHoursSchema, toMinutes, formatTime } from "../../src/modules/teren/schedule.schemas";

describe("program de funcționare și intervale (US-07 ticket / US-06 backlog)", () => {
  it.each([
    { opensAt: "12:00", closesAt: "23:00" },
    { opensAt: "00:00", closesAt: "24:00" },
    { opensAt: "23:59", closesAt: "24:00" },
  ])("acceptă programul %o", (input) => {
    expect(operatingHoursSchema.safeParse(input).success).toBe(true);
  });

  it.each([
    { opensAt: "12:00", closesAt: "12:00" }, { opensAt: "23:00", closesAt: "01:00" },
    { opensAt: "24:00", closesAt: "24:00" }, { opensAt: "9:00", closesAt: "23:00" },
    { opensAt: "12:60", closesAt: "23:00" }, { opensAt: "12:00", closesAt: "24:01" },
    { opensAt: 12, closesAt: "23:00" }, { opensAt: "12:00" }, {},
    { opensAt: "12:00", closesAt: "23:00", adminId: "forged" },
  ])("refuză programul invalid %o", (input) => {
    expect(operatingHoursSchema.safeParse(input).success).toBe(false);
  });

  it("acceptă o dată bisectă și un interval de un minut", () => {
    expect(availabilitySchema.safeParse({ date: "2028-02-29", startsAt: "12:00", endsAt: "12:01" }).success).toBe(true);
  });

  it.each([
    { date: "2027-02-29" }, { date: "2027-04-31" }, { date: "17-11-2026" }, { date: "0000-01-01" },
    { date: "2027-01-01T00:00:00Z" }, { startsAt: "14:00", endsAt: "13:00" },
    { startsAt: "12:00", endsAt: "12:00" }, { startsAt: "12:00:00" },
    { endsAt: "12:00+02:00" }, { fieldId: "forged" },
  ])("refuză intervalul invalid %o", (override) => {
    expect(availabilitySchema.safeParse({ date: "2027-01-01", startsAt: "12:00", endsAt: "13:00", ...override }).success).toBe(false);
  });

  it.each([["00:00", 0], ["12:30", 750], ["23:59", 1439], ["24:00", 1440]] as const)(
    "convertește %s fără fusul orar al serverului", (time, minutes) => {
      expect(toMinutes(time)).toBe(minutes);
      expect(formatTime(minutes)).toBe(time);
    },
  );
});
