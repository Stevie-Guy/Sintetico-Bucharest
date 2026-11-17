import { apiRequest } from "@/api/client";

export type RegistrationRole = "PLAYER" | "FIELD_ADMIN" | "CHAMPIONSHIP_ORGANIZER";

export const registrationRoles: { value: RegistrationRole; label: string; description: string }[] = [
  {
    value: "PLAYER",
    label: "Jucător",
    description: "Rezervi terenuri, te înscrii la meciuri și îți urmărești rank-ul.",
  },
  {
    value: "FIELD_ADMIN",
    label: "Administrator teren",
    description: "Îți adaugi terenul în aplicație și gestionezi programul și rezervările.",
  },
  {
    value: "CHAMPIONSHIP_ORGANIZER",
    label: "Organizator campionate",
    description: "Organizezi campionate. Poți juca și meciuri, ca orice jucător.",
  },
];

/** ADMIN nu se alege la înregistrare: contul se creează din backend, cu `npm run create-admin`. */
export type UserRole = RegistrationRole | "ADMIN";

/**
 * Perspectivele între care poate comuta Administratorul: a lui și a fiecărui tip de cont.
 * Backend-ul îi permite adminului acțiunile tuturor rolurilor, deci poate folosi efectiv fiecare perspectivă.
 */
export const viewRoles: { value: UserRole; label: string; description: string }[] = [
  {
    value: "ADMIN",
    label: "Administrator",
    description: "Moderezi conturile și conținutul și rezolvi contestațiile la rezultate.",
  },
  ...registrationRoles,
];

export const roleLabel = (role: UserRole) => viewRoles.find((r) => r.value === role)?.label ?? role;

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  role: RegistrationRole;
}

export interface LoginResult {
  token: string;
  expiresAt: string;
  user: User;
}

// US-01
export async function register(input: RegisterInput): Promise<User> {
  const { user } = await apiRequest<{ user: User }>("/api/auth/register", { method: "POST", body: input });
  return user;
}

// US-02
export function login(email: string, password: string): Promise<LoginResult> {
  return apiRequest<LoginResult>("/api/auth/login", { method: "POST", body: { email, password } });
}

export async function getMe(token: string): Promise<User> {
  const { user } = await apiRequest<{ user: User }>("/api/auth/me", { token });
  return user;
}

export function logout(token: string): Promise<void> {
  return apiRequest<void>("/api/auth/logout", { method: "POST", token });
}
