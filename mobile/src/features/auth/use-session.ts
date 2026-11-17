import { useAuth } from "./auth-context";
import type { User, UserRole } from "./api";

/**
 * Sesiunea curentă pentru ecranele care cer autentificare. Întoarce `null` fără sesiune;
 * ecranul face atunci `<Redirect href="/" />`.
 *
 * `isPlayer` include organizatorul (specializare a jucătorului). `activeRole` e perspectiva
 * aleasă de Administrator sau rolul contului.
 *
 * `mustCompleteProfile`: lipsesc numele sau telefonul, deci acțiunile sunt blocate. Se calculează după
 * perspectivă, nu după rolul contului: Administratorul e scutit doar în perspectiva lui; în perspectiva
 * altui rol vede și pățește exact ce ar vedea acel rol.
 */
/** Regula de profil obligatoriu, aplicată după perspectiva activă (vezi `useSession`). */
export function mustCompleteProfile(activeRole: UserRole, profileComplete: boolean): boolean {
  return activeRole !== "ADMIN" && !profileComplete;
}

export function useSession(): {
  token: string;
  user: User;
  activeRole: UserRole;
  isPlayer: boolean;
  isFieldAdmin: boolean;
  mustCompleteProfile: boolean;
} | null {
  const { state, activeRole } = useAuth();
  if (state.status !== "signedIn" || !activeRole) return null;
  return {
    token: state.token,
    user: state.user,
    activeRole,
    isPlayer: activeRole === "PLAYER" || activeRole === "CHAMPIONSHIP_ORGANIZER",
    isFieldAdmin: activeRole === "FIELD_ADMIN",
    mustCompleteProfile: mustCompleteProfile(activeRole, state.user.profileComplete),
  };
}
