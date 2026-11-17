import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Locul unde se păstrează token-ul de sesiune între deschideri ale aplicației.
 *
 * Pe telefon: expo-secure-store (Keychain pe iOS, Keystore pe Android).
 * În browser (`npm run web`) expo-secure-store nu există, așa că se folosește localStorage.
 * Varianta web e doar pentru verificări în dezvoltare; localStorage nu e un loc sigur pentru token-uri.
 */

const KEY = "sintetico.session-token";
const isWeb = Platform.OS === "web";

export async function getStoredToken(): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(KEY) ?? null;
  return SecureStore.getItemAsync(KEY);
}

export async function storeToken(token: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(KEY, token);
    return;
  }
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
