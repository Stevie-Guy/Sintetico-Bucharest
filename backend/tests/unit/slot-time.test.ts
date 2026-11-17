import { resolveSlotTimes } from "../../src/modules/teren/slot-time";

const slot = (date: string, startsAt: number, endsAt: number) => ({ date: new Date(`${date}T00:00:00.000Z`), startsAt, endsAt });

describe("orele rezervării în Europe/Bucharest", () => {
  it("convertește ora de iarnă fără a depinde de fusul serverului", () => {
    const times = resolveSlotTimes(slot("2027-01-15", 720, 780));
    expect(times?.startsAtUtc.toISOString()).toBe("2027-01-15T10:00:00.000Z");
    expect(times?.endsAtUtc.toISOString()).toBe("2027-01-15T11:00:00.000Z");
  });
  it("convertește ora de vară", () => {
    expect(resolveSlotTimes(slot("2027-07-15", 720, 780))?.startsAtUtc.toISOString()).toBe("2027-07-15T09:00:00.000Z");
  });
  it("tratează 24:00 ca miezul nopții următoare", () => {
    expect(resolveSlotTimes(slot("2027-01-15", 1380, 1440))?.endsAtUtc.toISOString()).toBe("2027-01-15T22:00:00.000Z");
  });
  it.each(["2027-03-28", "2027-10-31"])("respinge ora inexistentă sau ambiguă din %s", (date) => {
    expect(resolveSlotTimes(slot(date, 210, 240))).toBeNull();
    expect(resolveSlotTimes(slot(date, 120, 210))).toBeNull();
  });
  it("permite un interval cu limite neambigue peste schimbarea orei", () => {
    const times = resolveSlotTimes(slot("2027-03-28", 120, 300));
    expect(times?.startsAtUtc.toISOString()).toBe("2027-03-28T00:00:00.000Z");
    expect(times?.endsAtUtc.toISOString()).toBe("2027-03-28T02:00:00.000Z");
  });
});
