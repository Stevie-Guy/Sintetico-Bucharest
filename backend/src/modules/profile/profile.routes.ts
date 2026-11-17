import { Router } from "express";
import { AppError } from "../../errors/app-error";
import { getAuth, requireAuth } from "../../middleware/require-auth";
import { validateBody } from "../../middleware/validate-body";
import { updateProfileSchema, type UpdateProfileInput } from "./profile.schemas";
import { getPlayerProfile, updatePlayerProfile } from "./profile.service";

export const profileRouter = Router();

// Profilul e deschis tuturor rolurilor: numele și telefonul sunt obligatorii pentru orice acțiune.
profileRouter.use(requireAuth);

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
