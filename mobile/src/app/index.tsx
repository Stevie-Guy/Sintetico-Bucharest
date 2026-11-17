import { Redirect, router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton, SecondaryButton } from "@/components/form";
import { useAuth } from "@/features/auth/auth-context";
import { colors } from "@/theme";

export default function WelcomeScreen() {
  const { state } = useAuth();

  // La pornire se verifică token-ul salvat; până atunci nu știm ce ecran să arătăm.
  if (state.status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (state.status === "signedIn") return <Redirect href="/account" />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Sintetico</Text>
        <Text style={styles.subtitle}>
          Meciuri echilibrate de fotbal amator în București, pe categoria ta de vârstă.
        </Text>

        <PrimaryButton label="Autentificare" onPress={() => router.push("/login")} />
        <SecondaryButton label="Creează cont" onPress={() => router.push("/register")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  title: { fontSize: 36, fontWeight: "800", color: colors.primary },
  subtitle: { fontSize: 17, lineHeight: 24, color: colors.textMuted, marginTop: 16, marginBottom: 12 },
});
