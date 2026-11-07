import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Hashing de parole cu scrypt, din modulul `crypto` inclus în Node.js (fără bibliotecă externă).
 *
 * Formatul salvat în baza de date conține tot ce trebuie pentru verificare:
 *   scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>
 * Astfel parametrii se pot crește mai târziu fără să invalideze parolele vechi.
 */

const ALGORITHM = "scrypt";
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const DEFAULT_PARAMS = { N: 16384, r: 8, p: 1 } as const;

function deriveKey(password: string, salt: Buffer, params: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, params, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const { N, r, p } = DEFAULT_PARAMS;
  const key = await deriveKey(password, salt, { N, r, p });
  return [ALGORITHM, N, r, p, salt.toString("base64"), key.toString("base64")].join("$");
}

/** Verifică o parolă față de un hash produs de `hashPassword`. Comparația este în timp constant. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== ALGORITHM) return false;

  const [, N, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await deriveKey(password, Buffer.from(saltB64, "base64"), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
