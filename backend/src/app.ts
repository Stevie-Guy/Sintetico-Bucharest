import express from "express";
import { matchRouter } from "./modules/matches/match.routes";
import { reservationRouter } from "./modules/reservations/reservation.routes";
import { notificationRouter } from "./modules/notifications/notification.routes";
import { env } from "./config/env";
import { cors } from "./middleware/cors";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { authRouter } from "./modules/auth/auth.routes";
import { profileRouter } from "./modules/profile/profile.routes";
import terenRoutes from './modules/teren/teren.routes';
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
  app.use("/api/profile", profileRouter);
  app.use("/api/terenuri", terenRoutes);
  app.use("/api/reservations", reservationRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/matches", matchRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
