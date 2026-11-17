import { Redirect, router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton, SecondaryButton } from "@/components/form";
import { useAuth } from "@/features/auth/auth-context";
import { colors, radius } from "@/theme";

const features = [
  { icon: "⚽", text: "Meciuri pe categoria ta de vârstă" },
  { icon: "🏟️", text: "Rezervi terenuri din tot Bucureștiul" },
  { icon: "📈", text: "Rank care crește cu fiecare victorie" },
];

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

  if (state.status === "signedIn") return <Redirect href="/home" />;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.hero} edges={["top"]}>
        <View style={styles.heroInner}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>⚽</Text>
          </View>
          <Text style={styles.title}>Sintetico</Text>
          <Text style={styles.subtitle}>
            Meciuri echilibrate de fotbal amator în București, pe categoria ta de vârstă.
          </Text>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.bottom} edges={["bottom"]}>
        <View style={styles.bottomInner}>
          <View style={styles.features}>
            {features.map((f) => (
              <View key={f.text} style={styles.feature}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          <PrimaryButton label="Autentificare" onPress={() => router.push("/login")} />
          <SecondaryButton label="Nu ai cont? Creează unul" onPress={() => router.push("/register")} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  root: { flex: 1, backgroundColor: colors.background },
  hero: {
    flex: 1,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroInner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoIcon: { fontSize: 38 },
  title: { fontSize: 40, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  subtitle: { fontSize: 17, lineHeight: 25, color: colors.primaryLight, marginTop: 10 },
  bottom: { backgroundColor: colors.background },
  bottomInner: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, width: "100%", maxWidth: 520, alignSelf: "center" },
  features: { gap: 10 },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  featureIcon: { fontSize: 22 },
  featureText: { fontSize: 15, color: colors.text, fontWeight: "600", flex: 1 },
});
