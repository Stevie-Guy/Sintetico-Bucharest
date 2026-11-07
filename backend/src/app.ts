import express from "express";
import { env } from "./config/env";
import { cors } from "./middleware/cors";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { authRouter } from "./modules/auth/auth.routes";

/** Construiește aplicația Express fără să pornească serverul (folosit și de testele Supertest). */
export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors(env.CORS_ORIGINS));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
