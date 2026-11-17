import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError } from "@/api/client";
import * as authApi from "./api";
import type { User, UserRole } from "./api";
import { clearStoredToken, getStoredToken, storeToken } from "./token-storage";

/**
 * Starea autentificării (US-02), disponibilă în toată aplicația prin `useAuth()`.
 *
 * La pornire, dacă există un token salvat, se verifică la server (`GET /api/auth/me`).
 * Un token expirat sau invalid se șterge, iar utilizatorul trebuie să se autentifice din nou.
 *
 * `activeRole` este rolul din perspectiva căruia se afișează aplicația; ecranele aleg ce arată
 * după el, nu după `user.role`. Pentru conturile obișnuite e chiar rolul contului. Administratorul
 * îl poate schimba cu `setActiveRole`, ca să vadă aplicația ca oricare alt tip de cont. Alegerea
 * se ține doar în memorie: la o nouă autentificare adminul pornește din perspectiva lui.
 */

type AuthState =
  | { status: "loading"; user: null; token: null }
  | { status: "signedOut"; user: null; token: null }
  | { status: "signedIn"; user: User; token: string };

interface AuthContextValue {
  state: AuthState;
  /** Rolul din perspectiva căruia se afișează aplicația; `null` fără sesiune. */
  activeRole: UserRole | null;
  /** Doar pentru Administrator; la celelalte conturi nu are efect. */
  setActiveRole: (role: UserRole) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const signedOut: AuthState = { status: "signedOut", user: null, token: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null, token: null });
  // Perspectiva aleasă de admin; `null` = rolul contului.
  const [viewRole, setViewRole] = useState<UserRole | null>(null);

  const user = state.user;
  const isAdmin = user?.role === "ADMIN";
  const activeRole = user ? (isAdmin && viewRole ? viewRole : user.role) : null;

  const setActiveRole = useCallback(
    (role: UserRole) => {
      if (isAdmin) setViewRole(role);
    },
    [isAdmin],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await getStoredToken().catch(() => null);
      if (!token) {
        if (!cancelled) setState(signedOut);
        return;
      }

      try {
        const user = await authApi.getMe(token);
        if (!cancelled) setState({ status: "signedIn", user, token });
      } catch (err) {
        // 401 = sesiune expirată sau ștearsă. La alte erori (ex. fără internet) păstrăm token-ul
        // și îl reîncercăm la următoarea pornire.
        if (err instanceof ApiError && err.status === 401) await clearStoredToken().catch(() => {});
        if (!cancelled) setState(signedOut);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { token, user } = await authApi.login(email.trim(), password);
    await storeToken(token);
    setViewRole(null);
    setState({ status: "signedIn", user, token });
  }, []);

  const signOut = useCallback(async () => {
    const token = state.token;
    // Deconectarea locală are loc oricum; dacă serverul nu răspunde, sesiunea lui expiră singură.
    if (token) await authApi.logout(token).catch(() => {});
    await clearStoredToken().catch(() => {});
    setViewRole(null);
    setState(signedOut);
  }, [state.token]);

  const value = useMemo(
    () => ({ state, activeRole, setActiveRole, signIn, signOut }),
    [state, activeRole, setActiveRole, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() trebuie folosit în interiorul <AuthProvider>.");
  return ctx;
}
