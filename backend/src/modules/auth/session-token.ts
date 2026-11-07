import { createHash, randomBytes } from "node:crypto";

/**
 * Token-uri de sesiune (US-02).
 *
 * Token-ul este un șir aleator de 32 de octeți (256 de biți), trimis clientului o singură dată.
 * În baza de date se salvează doar SHA-256 al lui. Un hash rapid e suficient aici (spre deosebire de
 * parole), pentru că token-ul e complet aleator și nu poate fi ghicit prin încercări.
 */

const TOKEN_BYTES = 32;

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashSessionToken(token) };
}

/** Extrage token-ul din antetul `Authorization: Bearer <token>`. */
export function parseBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}
