import type { RequestHandler } from "express";

/**
 * CORS minimal: permite apeluri din browser doar de la originile din listă
 * (ex. aplicația Expo pornită cu `npm run web` pe http://localhost:8081).
 * Aplicația de pe telefon nu are nevoie de CORS; doar browserele îl verifică.
 */
export function cors(allowedOrigins: readonly string[]): RequestHandler {
  return (req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Max-Age", "600");
      res.setHeader("Vary", "Origin");
    }

    // Cererea preliminară (preflight) a browserului nu trebuie să ajungă la rute.
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  };
}
