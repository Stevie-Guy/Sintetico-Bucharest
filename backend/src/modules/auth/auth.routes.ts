import { Router } from "express";
import { getAuth, requireAuth } from "../../middleware/require-auth";
import { validateBody } from "../../middleware/validate-body";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "./auth.schemas";
import { loginUser, logout, registerUser } from "./auth.service";

export const authRouter = Router();

// US-01: creare cont
authRouter.post("/register", validateBody(registerSchema), async (req, res) => {
  const user = await registerUser(req.body as RegisterInput);
  res.status(201).json({ user });
});

// US-02: autentificare
authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  const result = await loginUser(req.body as LoginInput);
  res.json(result);
});

// US-02: contul utilizatorului autentificat
authRouter.get("/me", requireAuth, (_req, res) => {
  res.json({ user: getAuth(res).user });
});

// US-02: deconectare
authRouter.post("/logout", requireAuth, async (_req, res) => {
  await logout(getAuth(res).sessionId);
  res.status(204).end();
});
