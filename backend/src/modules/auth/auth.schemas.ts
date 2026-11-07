import { z } from "zod";
import { getPasswordErrors } from "./password-rules";

/** Tipurile de cont care se pot alege la înregistrare. */
export const REGISTRATION_ROLES = ["PLAYER", "FIELD_ADMIN", "CHAMPIONSHIP_ORGANIZER"] as const;

export const registerSchema = z.object({
  email: z
    .string({ error: "Emailul este obligatoriu." })
    .trim()
    .toLowerCase()
    .pipe(
      z
        .email({ error: "Adresa de email nu este validă." })
        .max(254, { error: "Adresa de email este prea lungă." }),
    ),
  password: z.string({ error: "Parola este obligatorie." }).superRefine((password, ctx) => {
    for (const message of getPasswordErrors(password)) {
      ctx.addIssue({ code: "custom", message });
    }
  }),
  role: z.enum(REGISTRATION_ROLES, {
    error: "Alege tipul de cont: jucător, administrator de teren sau organizator de campionate.",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// La autentificare nu se reaplică regulile parolei: dacă regulile se schimbă,
// conturile create cu reguli mai vechi trebuie să se poată autentifica în continuare.
export const loginSchema = z.object({
  email: z
    .string({ error: "Emailul este obligatoriu." })
    .trim()
    .toLowerCase()
    .min(1, { error: "Emailul este obligatoriu." }),
  password: z.string({ error: "Parola este obligatorie." }).min(1, { error: "Parola este obligatorie." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
