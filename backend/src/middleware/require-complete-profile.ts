import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error";
import { getAuth } from "./require-auth";

/**
 * Permite ruta doar dacă profilul are nume și telefon (vezi `isProfileComplete`).
 * Se pune după `requireAuth` pe rutele care modifică date; citirile rămân deschise.
 *
 * Administratorul e scutit aici, la API. Serverul nu știe ce perspectivă folosește în aplicație;
 * când adminul vede aplicația ca alt rol, aplicația mobilă îi aplică regula ca acelui rol.
 */
export const requireCompleteProfile: RequestHandler = (_req, res, next) => {
  const { user } = getAuth(res);
  if (user.role !== "ADMIN" && !user.profileComplete) {
    throw new AppError(
      403,
      "PROFILE_INCOMPLETE",
      "Completează-ți numele și numărul de telefon în profil ca să poți folosi această funcție.",
    );
  }
  next();
};
