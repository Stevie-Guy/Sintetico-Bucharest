import { Router } from "express";
import { getAuth, requireAuth } from "../../middleware/require-auth";
import { requireRole } from "../../middleware/require-role";
import { validateBody } from "../../middleware/validate-body";
import { parseInput } from "../../middleware/parse-input";
import { createMatchSchema, joinMatchSchema, matchIdSchema, matchPaginationSchema, type CreateMatchInput } from "./match.schemas";
import { createMatch, getMatch, joinMatch, listEligibleReservations, listMatches, listParticipants } from "./match.service";

export const matchRouter = Router();
matchRouter.use(requireAuth);

matchRouter.get("/eligible-reservations", requireRole("PLAYER"), async (req, res) => {
  res.json(await listEligibleReservations(getAuth(res).user.id, parseInput(matchPaginationSchema, req.query)));
});
matchRouter.get("/", async (req, res) => {
  res.json(await listMatches(parseInput(matchPaginationSchema, req.query)));
});
matchRouter.post("/", requireRole("PLAYER"), validateBody(createMatchSchema), async (req, res) => {
  res.status(201).json(await createMatch(getAuth(res).user.id, req.body as CreateMatchInput));
});
matchRouter.get("/:id", async (req, res) => {
  const { id } = parseInput(matchIdSchema, req.params);
  res.json({ match: await getMatch(id) });
});
matchRouter.get("/:id/participants", async (req, res) => {
  const { id } = parseInput(matchIdSchema, req.params);
  res.json(await listParticipants(id, parseInput(matchPaginationSchema, req.query)));
});
matchRouter.post("/:id/participants", requireRole("PLAYER"), validateBody(joinMatchSchema), async (req, res) => {
  const { id } = parseInput(matchIdSchema, req.params);
  res.status(201).json({ match: await joinMatch(getAuth(res).user.id, id) });
});
