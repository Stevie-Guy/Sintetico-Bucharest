import { useAuth } from "./auth-context";
import type { User, UserRole } from "./api";

/**
 * Sesiunea curentă pentru ecranele care cer autentificare. Întoarce `null` fără sesiune;
 * ecranul face atunci `<Redirect href="/" />`.
 *
 * `isPlayer` include organizatorul (specializare a jucătorului). `activeRole` e perspectiva
 * aleasă de Administrator sau rolul contului.
 */
export function useSession(): {
  token: string;
  user: User;
  activeRole: UserRole;
  isPlayer: boolean;
  isFieldAdmin: boolean;
} | null {
  const { state, activeRole } = useAuth();
  if (state.status !== "signedIn" || !activeRole) return null;
  return {
    token: state.token,
    user: state.user,
    activeRole,
    isPlayer: activeRole === "PLAYER" || activeRole === "CHAMPIONSHIP_ORGANIZER",
    isFieldAdmin: activeRole === "FIELD_ADMIN",
  };
}
