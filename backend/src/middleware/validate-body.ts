import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../errors/app-error";

/**
 * Validează `req.body` cu o schemă Zod și îl înlocuiește cu datele curățate (trim, lowercase etc.).
 * Dacă datele nu sunt valide, răspunde cu 400 și erorile pe fiecare câmp.
 */
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Datele trimise nu sunt valide.",
        fieldErrors as Record<string, string[]>,
      );
    }
    req.body = result.data;
    next();
  };
}
