import { z } from "zod";

// Variabilele de mediu se validează la pornire, ca o configurare greșită să oprească imediat serverul.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL lipsește din .env"),
  // Cât timp e valabilă o sesiune de autentificare (US-02). Implicit 7 zile.
  SESSION_TTL_HOURS: z.coerce.number().positive().default(168),
  // Originile din browser care pot apela API-ul, separate prin virgulă.
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:8081")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
