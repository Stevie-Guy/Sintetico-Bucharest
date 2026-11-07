import type { RequestHandler } from "express";
import type { UserRole } from "../generated/prisma/enums";
import { AppError } from "../errors/app-error";
import { hasRole } from "../modules/auth/roles";
import { getAuth } from "./require-auth";

/**
 * Permite ruta doar utilizatorilor cu unul dintre rolurile date (vezi `hasRole`: ADMIN trece mereu,
 * organizatorul trece și unde se cere PLAYER). Se pune după `requireAuth`:
 *
 *   router.post("/fields", requireAuth, requireRole("FIELD_ADMIN"), handler)
 */
export function requireRole(...allowed: UserRole[]): RequestHandler {
  return (_req, res, next) => {
    if (!hasRole(getAuth(res).user.role, allowed)) {
      throw new AppError(403, "FORBIDDEN", "Nu ai acces la această acțiune.");
    }
    next();
  };
}
