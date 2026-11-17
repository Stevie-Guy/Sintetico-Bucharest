import { z } from "zod";
import { calendarDate } from "../teren/schedule.schemas";

export const createReservationSchema = z.strictObject({
  availabilityId: z.uuid(),
  // Clientul rezervă exact versiunea intervalului afișată, nu un interval editat între timp.
  expectedVersion: z.number().int().positive().max(2147483647),
});
export const reservationIdSchema = z.object({ id: z.uuid() });
export const decisionSchema = z.strictObject({ status: z.enum(["APPROVED", "REJECTED"]) });
export const paginationShape = {
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};
export const reservationQuerySchema = z.strictObject({
  ...paginationShape,
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  date: calendarDate.optional(),
});
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ReservationQuery = z.infer<typeof reservationQuerySchema>;
export type ReservationDecision = z.infer<typeof decisionSchema>["status"];
