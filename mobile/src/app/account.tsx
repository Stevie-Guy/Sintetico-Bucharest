import { Redirect } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChoiceList } from "@/components/choice-list";
import { formStyles, SecondaryButton } from "@/components/form";
import { roleLabel, viewRoles } from "@/features/auth/api";
import { useAuth } from "@/features/auth/auth-context";
import { colors } from "@/theme";

// US-02: ecranul la care ajunge utilizatorul după autentificare; de aici se poate deconecta oricând.
// Administratorul alege tot de aici din perspectiva cărui rol vede aplicația.
export default function AccountScreen() {
  const { state, activeRole, setActiveRole, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  // După deconectare (sau fără sesiune) se revine la ecranul de început.
  if (state.status !== "signedIn" || !activeRole) return <Redirect href="/" />;

  const isAdmin = state.user.role === "ADMIN";

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <SafeAreaView style={formStyles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={formStyles.content}>
        <Text style={styles.greeting}>Ești autentificat</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Email</Text>
          <Text style={styles.cardValue}>{state.user.email}</Text>

          <Text style={[styles.cardLabel, styles.spaced]}>Tip de cont</Text>
          <Text style={styles.cardValue}>{roleLabel(state.user.role)}</Text>
        </View>

        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vezi aplicația ca</Text>
            <Text style={styles.sectionHint}>
              Alege un tip de cont ca să vezi aplicația din perspectiva lui. Ai acces la toate acțiunile
              acelui rol.
            </Text>
            <ChoiceList options={viewRoles} selected={activeRole} onSelect={setActiveRole} />
          </View>
        )}

        <SecondaryButton label="Deconectare" onPress={handleSignOut} loading={signingOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 24, fontWeight: "800", color: colors.text, marginTop: 8, marginBottom: 20 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  cardLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase" },
  cardValue: { fontSize: 17, color: colors.text, marginTop: 4 },
  spaced: { marginTop: 16 },
  section: { marginTop: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  sectionHint: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginTop: 4, marginBottom: 12 },
});
