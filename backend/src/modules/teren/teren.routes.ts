import { Router } from "express";
import { getAuth, requireAuth } from "../../middleware/require-auth";
import { requireRole } from "../../middleware/require-role";
import { validateBody } from "../../middleware/validate-body";
import { parseInput } from "../../middleware/parse-input";
import { fieldReservationRouter } from "../reservations/reservation.routes";
import { scheduleRouter } from "./schedule.routes";
import { fieldParamsSchema } from "./schedule.schemas";
import { fieldListQuerySchema, fieldSchema, type FieldInput } from "./teren.schemas";
import { createField, getField, listFields, updateField } from "./teren.service";

/** US-05: terenurile. Rutele de program și rezervări sunt montate sub același prefix. */
const router = Router();

router.get("/", requireAuth, async (req, res) => {
  res.json(await listFields(parseInput(fieldListQuerySchema, req.query)));
});
router.post("/", requireAuth, requireRole("FIELD_ADMIN"), validateBody(fieldSchema), async (req, res) => {
  res.status(201).json({ field: await createField(getAuth(res).user.id, req.body as FieldInput) });
});
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = parseInput(fieldParamsSchema, req.params);
  res.json({ field: await getField(id) });
});
router.put("/:id", requireAuth, requireRole("FIELD_ADMIN"), validateBody(fieldSchema), async (req, res) => {
  const { id } = parseInput(fieldParamsSchema, req.params);
  res.json({ field: await updateField(id, getAuth(res).user.id, req.body as FieldInput) });
});

router.use(fieldReservationRouter);
router.use(scheduleRouter);

export default router;
