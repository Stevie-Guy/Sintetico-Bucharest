/**
 * Regulile parolei, afișate în timp real în formularul de creare cont.
 *
 * COPIE a backend/src/modules/auth/password-rules.ts. Dacă schimbați regulile, schimbați-le în
 * ambele locuri. Backend-ul face validarea finală; aici e doar ajutor pentru utilizator.
 */

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_MAX_LENGTH = 128;

const length = (value: string) => Array.from(value).length;

export const passwordRules: readonly PasswordRule[] = [
  { id: "minLength", label: "Cel puțin 8 caractere", test: (p) => length(p) >= 8 },
  { id: "uppercase", label: "O literă mare", test: (p) => /\p{Lu}/u.test(p) },
  { id: "digit", label: "O cifră", test: (p) => /\d/.test(p) },
  { id: "special", label: "Un caracter special (ex. ! @ # $ %)", test: (p) => /[^\p{L}\p{N}\s]/u.test(p) },
];

export function isPasswordValid(password: string): boolean {
  return passwordRules.every((rule) => rule.test(password)) && length(password) <= PASSWORD_MAX_LENGTH;
}
