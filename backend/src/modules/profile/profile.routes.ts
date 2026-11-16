import { Router } from "express";
import { AppError } from "../../errors/app-error";
import { getAuth, requireAuth } from "../../middleware/require-auth";
import { requireRole } from "../../middleware/require-role";
import { validateBody } from "../../middleware/validate-body";
import { updateProfileSchema, type UpdateProfileInput } from "./profile.schemas";
import { getPlayerProfile, updatePlayerProfile } from "./profile.service";

export const profileRouter = Router();

profileRouter.use(requireAuth, requireRole("PLAYER"));

profileRouter.get("/", async (_req, res) => {
  const profile = await getPlayerProfile(getAuth(res).user.id);
  if (!profile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Profilul nu există.");
  }
  res.json({ user: profile });
});

profileRouter.patch("/", validateBody(updateProfileSchema), async (req, res) => {
  const profile = await updatePlayerProfile(getAuth(res).user.id, req.body as UpdateProfileInput);
  res.json({ user: profile });
});
