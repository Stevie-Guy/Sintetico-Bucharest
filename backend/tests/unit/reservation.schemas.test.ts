import { createReservationSchema, decisionSchema, reservationQuerySchema } from "../../src/modules/reservations/reservation.schemas";

const valid = { availabilityId: "5977cf9a-1c01-47d3-95e3-f8f72d5ec077", expectedVersion: 1 };
describe("validare rezervări", () => {
  it("acceptă alegerea unui interval existent și a versiunii afișate", () => {
    expect(createReservationSchema.parse(valid)).toEqual(valid);
  });
  it.each([
    {}, { availabilityId: valid.availabilityId }, { ...valid, availabilityId: "invalid" },
    { ...valid, expectedVersion: 0 }, { ...valid, expectedVersion: "1" }, { ...valid, expectedVersion: 1.5 },
    { ...valid, playerId: valid.availabilityId }, { ...valid, status: "APPROVED" },
    { ...valid, startsAt: "12:00" },
  ])("respinge date sau câmpuri controlate de server %o", (input) => {
    expect(createReservationSchema.safeParse(input).success).toBe(false);
  });
  it("acceptă doar deciziile finale, fără schimbare de proprietar", () => {
    expect(decisionSchema.safeParse({ status: "APPROVED" }).success).toBe(true);
    expect(decisionSchema.safeParse({ status: "REJECTED" }).success).toBe(true);
    expect(decisionSchema.safeParse({ status: "PENDING" }).success).toBe(false);
    expect(decisionSchema.safeParse({ status: "APPROVED", playerId: valid.availabilityId }).success).toBe(false);
  });
  it.each([{ page: 0 }, { pageSize: 101 }, { status: "invalid" }, { date: "2027-02-29" }, { playerId: valid.availabilityId }])(
    "respinge filtre invalide %o", (input) => expect(reservationQuerySchema.safeParse(input).success).toBe(false),
  );
});
