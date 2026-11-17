import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/features/auth/auth-context";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: "Creează cont" }} />
        <Stack.Screen name="login" options={{ title: "Autentificare" }} />
        {/* Fără buton „înapoi”: din cont se iese doar prin Deconectare. */}
        <Stack.Screen
          name="account"
          options={{ title: "Contul meu", headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack>
    </AuthProvider>
  );
}
