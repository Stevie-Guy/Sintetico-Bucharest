import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { getAuth, requireAuth } from "../../middleware/require-auth";
import { requireRole } from "../../middleware/require-role";
import { validateBody } from "../../middleware/validate-body";
import {
  availabilityQuerySchema, availabilitySchema, fieldParamsSchema, intervalParamsSchema, operatingHoursSchema,
  type AvailabilityInput, type OperatingHoursInput,
} from "./schedule.schemas";
import {
  deleteAvailability, deleteOperatingHours, getOperatingHours, listAvailability, saveAvailability, setOperatingHours,
} from "./schedule.service";

function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) throw new AppError(400, "VALIDATION_ERROR", "Parametrii trimiși nu sunt valizi.",
    z.flattenError(result.error).fieldErrors as Record<string, string[]>);
  return result.data;
}

export const scheduleRouter = Router();
scheduleRouter.use(requireAuth);

scheduleRouter.get("/:id/operating-hours", async (req, res) => {
  const { id } = parseInput(fieldParamsSchema, req.params);
  res.json({ operatingHours: await getOperatingHours(id) });
});

scheduleRouter.put("/:id/operating-hours", requireRole("FIELD_ADMIN"), validateBody(operatingHoursSchema), async (req, res) => {
  const { id } = parseInput(fieldParamsSchema, req.params);
  res.json({ operatingHours: await setOperatingHours(id, getAuth(res).user.id, req.body as OperatingHoursInput) });
});

scheduleRouter.delete("/:id/operating-hours", requireRole("FIELD_ADMIN"), async (req, res) => {
  const { id } = parseInput(fieldParamsSchema, req.params);
  await deleteOperatingHours(id, getAuth(res).user.id);
  res.status(204).end();
});

scheduleRouter.get("/:id/availability", async (req, res) => {
  const { id } = parseInput(fieldParamsSchema, req.params);
  const { date } = parseInput(availabilityQuerySchema, req.query);
  res.json({ intervals: await listAvailability(id, date) });
});

scheduleRouter.post("/:id/availability", requireRole("FIELD_ADMIN"), validateBody(availabilitySchema), async (req, res) => {
  const { id } = parseInput(fieldParamsSchema, req.params);
  res.status(201).json({ interval: await saveAvailability(id, getAuth(res).user.id, req.body as AvailabilityInput) });
});

scheduleRouter.put("/:id/availability/:intervalId", requireRole("FIELD_ADMIN"), validateBody(availabilitySchema), async (req, res) => {
  const { id, intervalId } = parseInput(intervalParamsSchema, req.params);
  res.json({ interval: await saveAvailability(id, getAuth(res).user.id, req.body as AvailabilityInput, intervalId) });
});

scheduleRouter.delete("/:id/availability/:intervalId", requireRole("FIELD_ADMIN"), async (req, res) => {
  const { id, intervalId } = parseInput(intervalParamsSchema, req.params);
  await deleteAvailability(id, getAuth(res).user.id, intervalId);
  res.status(204).end();
});
