import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/features/auth/auth-context";
import { ProfileGateProvider } from "@/features/profile/profile-gate";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* Overlay-ul „Completează-ți profilul” (nume și telefon obligatorii pentru orice acțiune). */}
      <ProfileGateProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontWeight: "700" },
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: colors.surface },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: "" }} />
        <Stack.Screen name="login" options={{ title: "" }} />
        {/* Ecranul principal după autentificare. Fără buton „înapoi”: de aici se iese doar prin Deconectare. */}
        <Stack.Screen
          name="home"
          options={{ headerShown: false, headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen name="account" options={{ title: "Contul meu" }} />
        {/* Titlurile celorlalte ecrane se setează în fiecare ecran, cu <Stack.Screen options={...} />. */}
      </Stack>
      </ProfileGateProvider>
    </AuthProvider>
  );
}
