import type { RequestHandler, Response } from "express";
import { AppError } from "../errors/app-error";
import { authenticateToken, type AuthContext } from "../modules/auth/auth.service";
import { parseBearerToken } from "../modules/auth/session-token";

/**
 * Protejează o rută: cere antetul `Authorization: Bearer <token>` cu o sesiune validă.
 * Utilizatorul autentificat se citește apoi în handler cu `getAuth(res)`.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) {
    throw new AppError(401, "UNAUTHENTICATED", "Trebuie să te autentifici.");
  }

  res.locals.auth = await authenticateToken(token);
  next();
};

export function getAuth(res: Response): AuthContext {
  const auth = res.locals.auth as AuthContext | undefined;
  if (!auth) {
    throw new Error("getAuth() a fost apelat pe o rută fără requireAuth.");
  }
  return auth;
}
