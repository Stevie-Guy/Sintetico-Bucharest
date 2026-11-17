import { z } from "zod";
import { paginationShape } from "../reservations/reservation.schemas";

export const matchPaginationSchema = z.strictObject(paginationShape);
export const matchIdSchema = z.object({ id: z.uuid() });
export const joinMatchSchema = z.strictObject({}).default({});
export const createMatchSchema = z.strictObject({
  reservationId: z.uuid(),
  // Offset explicit, ca ora să nu depindă de fusul orar al clientului/serverului.
  startsAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  maxPlayers: z.number().int().positive().max(2147483647),
  ageCategory: z.enum(["U12", "U15", "U18", "SENIOR", "VETERANS_35_PLUS"]),
});
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type MatchPagination = z.infer<typeof matchPaginationSchema>;
