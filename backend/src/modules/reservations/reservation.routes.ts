import { Router } from "express";
import { getAuth, requireAuth } from "../../middleware/require-auth";
import { requireRole } from "../../middleware/require-role";
import { validateBody } from "../../middleware/validate-body";
import { parseInput } from "../../middleware/parse-input";
import { fieldParamsSchema } from "../teren/schedule.schemas";
import { createReservationSchema, decisionSchema, reservationQuerySchema, type CreateReservationInput, type ReservationDecision } from "./reservation.schemas";
import { createReservation, decideReservation, listFieldReservations, listMyReservations } from "./reservation.service";
import { z } from "zod";

const decisionParamsSchema = fieldParamsSchema.extend({ reservationId: z.uuid() });
export const fieldReservationRouter = Router();
fieldReservationRouter.use(requireAuth);

fieldReservationRouter.post("/:id/reservations", requireRole("PLAYER"), validateBody(createReservationSchema), async (req, res) => {
  const { id } = parseInput(fieldParamsSchema, req.params);
  res.status(201).json({ reservation: await createReservation(id, getAuth(res).user.id, req.body as CreateReservationInput) });
});
fieldReservationRouter.get("/:id/reservations", requireRole("FIELD_ADMIN"), async (req, res) => {
  const { id } = parseInput(fieldParamsSchema, req.params);
  res.json(await listFieldReservations(id, getAuth(res).user.id, parseInput(reservationQuerySchema, req.query)));
});
fieldReservationRouter.patch("/:id/reservations/:reservationId", requireRole("FIELD_ADMIN"), validateBody(decisionSchema), async (req, res) => {
  const { id, reservationId } = parseInput(decisionParamsSchema, req.params);
  res.json({ reservation: await decideReservation(id, getAuth(res).user.id, reservationId, req.body.status as ReservationDecision) });
});

export const reservationRouter = Router();
reservationRouter.use(requireAuth, requireRole("PLAYER"));
reservationRouter.get("/", async (req, res) => {
  res.json(await listMyReservations(getAuth(res).user.id, parseInput(reservationQuerySchema, req.query)));
});
