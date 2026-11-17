import { Redirect } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ChoiceList } from "@/components/choice-list";
import { SecondaryButton } from "@/components/form";
import { Avatar, Badge, Card, Divider, Hint, InfoRow, Screen, SectionTitle } from "@/components/ui";
import { roleLabel, viewRoles } from "@/features/auth/api";
import { useAuth } from "@/features/auth/auth-context";
import { colors } from "@/theme";

// US-02: datele contului; de aici utilizatorul se poate deconecta oricând.
// Administratorul alege tot de aici din perspectiva cărui rol vede aplicația.
export default function AccountScreen() {
  const { state, activeRole, setActiveRole, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  // După deconectare (sau fără sesiune) se revine la ecranul de început.
  if (state.status !== "signedIn" || !activeRole) return <Redirect href="/" />;

  const isAdmin = state.user.role === "ADMIN";
  const name = state.user.email.split("@")[0];

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <Screen>
      <Card>
        <View style={styles.header}>
          <Avatar name={name} size={64} highlighted />
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Badge label={roleLabel(state.user.role)} tone="success" />
          </View>
        </View>
        <Divider />
        <InfoRow icon="✉️" label="Email" value={state.user.email} />
        <InfoRow icon="🪪" label="Tip de cont" value={roleLabel(state.user.role)} />
      </Card>

      {isAdmin && (
        <View>
          <SectionTitle>Vezi aplicația ca</SectionTitle>
          <Hint>Alege un tip de cont ca să vezi aplicația din perspectiva lui. Ai acces la toate acțiunile acelui rol.</Hint>
          <ChoiceList options={viewRoles} selected={activeRole} onSelect={setActiveRole} />
        </View>
      )}

      <SecondaryButton label="Deconectare" icon="🚪" danger onPress={handleSignOut} loading={signingOut} style={styles.signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 4 },
  flex: { flex: 1, gap: 6 },
  name: { fontSize: 20, fontWeight: "800", color: colors.text },
  signOut: { marginTop: 28 },
});
