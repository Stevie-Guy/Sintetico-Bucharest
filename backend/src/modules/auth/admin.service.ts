import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import { registerSchema } from "./auth.schemas";
import { publicUserFields, type PublicUser } from "./auth.service";
import { hashPassword } from "./password-hasher";

/** Emailul și parola adminului respectă aceleași reguli ca la crearea unui cont obișnuit (US-01). */
export const adminAccountSchema = registerSchema.pick({ email: true, password: true });

export type AdminAccountInput = z.input<typeof adminAccountSchema>;

/**
 * Creează contul de Administrator sau îl actualizează dacă emailul există deja: contul primește
 * rolul ADMIN și parola dată, iar sesiunile lui vechi se șterg (trebuie să se autentifice din nou).
 * Contul de Administrator nu se poate crea prin API; funcția e folosită de `npm run create-admin`.
 */
export async function upsertAdmin(input: AdminAccountInput): Promise<PublicUser> {
  const result = adminAccountSchema.safeParse(input);
  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error);
    throw new AppError(400, "VALIDATION_ERROR", "Datele adminului nu sunt valide.", fieldErrors);
  }

  const { email, password } = result.data;
  const passwordHash = await hashPassword(password);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      create: { email, passwordHash, role: "ADMIN" },
      update: { passwordHash, role: "ADMIN" },
      select: publicUserFields,
    });
    await tx.session.deleteMany({ where: { userId: user.id } });
    return user;
  });
}
