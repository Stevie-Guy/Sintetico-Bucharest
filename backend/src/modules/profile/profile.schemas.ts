import { z } from "zod";

const dateOfBirthSchema = z
  .iso
  .date({ error: "Data nașterii trebuie să fie o dată validă în formatul AAAA-LL-ZZ." })
  .refine((date) => date <= new Date().toISOString().slice(0, 10), {
    error: "Data nașterii nu poate fi în viitor.",
  })
  .nullable()
  .optional();

export const updateProfileSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(1, "Numele nu poate fi gol.")
      .max(128, "Numele poate avea cel mult 128 de caractere.")
      .nullable()
      .optional(),
    dateOfBirth: dateOfBirthSchema,
    preferredPosition: z.enum(["PORTAR", "FUNDAS", "MIJLOCAS", "ATACANT"]).nullable().optional(),
    dominantFoot: z.enum(["STANGA", "DREAPTA"]).nullable().optional(),
    phoneNumber: z
      .string()
      .regex(/^\+40\d{9}$/, "Numărul de telefon trebuie să aibă formatul +40 urmat de 9 cifre.")
      .nullable()
      .optional(),
  })
  .refine((profile) => Object.keys(profile).length > 0, {
    error: "Trimite cel puțin un câmp pentru actualizare.",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
