import { Prisma } from "../../generated/prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import type { LoginInput, RegisterInput } from "./auth.schemas";
import { hashPassword, verifyPassword } from "./password-hasher";
import { generateSessionToken, hashSessionToken } from "./session-token";

/** Câmpurile unui utilizator care pot fi trimise clientului (fără hash-ul parolei). */
export const publicUserFields = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserFields }>;

// ---------- US-01: creare cont ----------

export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.user.create({
      data: { email: input.email, passwordHash, role: input.role },
      select: publicUserFields,
    });
  } catch (err) {
    // Indexul unic pe email garantează regula și când două cereri sosesc simultan.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new AppError(409, "EMAIL_TAKEN", "Există deja un cont cu acest email.", {
        email: ["Există deja un cont cu acest email."],
      });
    }
    throw err;
  }
}

// ---------- US-02: autentificare ----------

export interface LoginResult {
  token: string;
  expiresAt: Date;
  user: PublicUser;
}

/**
 * Hash al unei parole oarecare, folosit când emailul nu există: verificarea durează la fel,
 * deci după timpul de răspuns nu se poate afla dacă un email are cont.
 */
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword("parola-inexistenta"));

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordOk = await verifyPassword(input.password, user?.passwordHash ?? (await getDummyHash()));

  if (!user || !passwordOk) {
    // Același mesaj pentru email inexistent și parolă greșită.
    throw new AppError(401, "INVALID_CREDENTIALS", "Email sau parolă greșită.");
  }

  const { token, tokenHash } = generateSessionToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
  await prisma.session.create({ data: { tokenHash, userId: user.id, expiresAt } });

  const { id, email, role, createdAt } = user;
  return { token, expiresAt, user: { id, email, role, createdAt } };
}

export interface AuthContext {
  sessionId: string;
  user: PublicUser;
}

/** Găsește sesiunea validă pentru un token. Sesiunile expirate se șterg la prima folosire. */
export async function authenticateToken(token: string): Promise<AuthContext> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { select: publicUserFields } },
  });

  if (!session) {
    throw new AppError(401, "UNAUTHENTICATED", "Trebuie să te autentifici.");
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    throw new AppError(401, "SESSION_EXPIRED", "Sesiunea a expirat. Autentifică-te din nou.");
  }

  return { sessionId: session.id, user: session.user };
}

/** Deconectare: șterge sesiunea, deci token-ul nu mai poate fi folosit. */
export async function logout(sessionId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}
