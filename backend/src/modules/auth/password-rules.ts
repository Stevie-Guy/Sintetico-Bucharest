/**
 * Regulile minime pentru parolă (US-01).
 *
 * Regulile se pot schimba pe parcurs: se modifică DOAR aici, iar validarea din API le preia automat.
 * Aplicația mobilă are o copie pentru afișarea în timp real a regulilor:
 * mobile/src/features/auth/password-rules.ts. Țineți-le sincronizate; backend-ul are ultimul cuvânt.
 */

export interface PasswordRule {
  id: string;
  message: string;
  test: (password: string) => boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

/** Limită de siguranță: parole foarte lungi ar încărca inutil funcția de hashing. */
export const PASSWORD_MAX_LENGTH = 128;

/** Lungimea în caractere reale (un emoji sau o diacritică compusă contează ca un caracter). */
const length = (value: string) => Array.from(value).length;

export const passwordRules: readonly PasswordRule[] = [
  {
    id: "minLength",
    message: `Parola trebuie să aibă cel puțin ${PASSWORD_MIN_LENGTH} caractere.`,
    test: (p) => length(p) >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "uppercase",
    message: "Parola trebuie să conțină cel puțin o literă mare.",
    // \p{Lu} acceptă și majuscule cu diacritice (Ă, Â, Î, Ș, Ț).
    test: (p) => /\p{Lu}/u.test(p),
  },
  {
    id: "digit",
    message: "Parola trebuie să conțină cel puțin o cifră.",
    test: (p) => /\d/.test(p),
  },
  {
    id: "special",
    message: "Parola trebuie să conțină cel puțin un caracter special (ex. ! @ # $ %).",
    // Caracter special = orice nu este literă, cifră sau spațiu.
    test: (p) => /[^\p{L}\p{N}\s]/u.test(p),
  },
];

/** Întoarce mesajele regulilor încălcate; o listă goală înseamnă parolă validă. */
export function getPasswordErrors(password: string): string[] {
  const errors = passwordRules.filter((rule) => !rule.test(password)).map((rule) => rule.message);
  if (length(password) > PASSWORD_MAX_LENGTH) {
    errors.push(`Parola poate avea cel mult ${PASSWORD_MAX_LENGTH} caractere.`);
  }
  return errors;
}
