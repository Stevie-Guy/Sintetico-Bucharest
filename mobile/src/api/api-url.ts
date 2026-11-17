import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Adresa backend-ului.
 *
 * Dacă `EXPO_PUBLIC_API_URL` e setată în `mobile/.env`, se folosește ea. Altfel, în dezvoltare,
 * adresa se deduce singură: backend-ul rulează pe același calculator ca serverul Expo, deci are
 * același IP. Așa aplicația merge și după ce schimbi rețeaua Wi-Fi, fără să editezi `.env`.
 *  - în browser: host-ul paginii (ex. `localhost`);
 *  - pe telefon / emulator: host-ul serverului Expo din `Constants.expoConfig.hostUri` (ex. `192.168.1.130:8081`).
 * Portul backend-ului e `EXPO_PUBLIC_API_PORT`, implicit 3000.
 */
export function resolveApiUrl(): string | null {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const port = process.env.EXPO_PUBLIC_API_PORT?.trim() || "3000";

  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }

  // `hostUri` există doar în dezvoltare (Expo Go / development build pornite cu `expo start`).
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ? `http://${host}:${port}` : null;
}
