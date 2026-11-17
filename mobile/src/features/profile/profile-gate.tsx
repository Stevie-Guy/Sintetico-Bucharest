import { router } from "expo-router";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { PrimaryButton, SecondaryButton } from "@/components/form";
import { IconBubble } from "@/components/ui";
import { useAuth } from "@/features/auth/auth-context";
import { mustCompleteProfile } from "@/features/auth/use-session";
import { colors, radius, shadow } from "@/theme";

/**
 * Fără nume și telefon în profil, contul poate doar să vadă aplicația. Orice acțiune (rezervare,
 * creare sau înscriere la meci, teren, program, aprobare) trece prin `requireProfile`: dacă profilul
 * nu e complet, în loc de acțiune apare un overlay care trimite la profil.
 *
 * Backend-ul aplică aceeași regulă (eroarea `PROFILE_INCOMPLETE`); aici e doar pentru o experiență mai bună.
 */

interface ProfileGateValue {
  /**
   * Rulează `action` dacă profilul e complet; altfel arată overlay-ul.
   * `feature` completează fraza „Completează-ți profilul pentru a …”, ex. „te înscrie la meci”.
   */
  requireProfile: (feature: string, action: () => void) => void;
}

const ProfileGateContext = createContext<ProfileGateValue | null>(null);

export function ProfileGateProvider({ children }: { children: ReactNode }) {
  const { state, activeRole } = useAuth();
  const [feature, setFeature] = useState<string | null>(null);
  // După perspectiva activă: adminul care vede aplicația ca alt rol e blocat ca acel rol.
  const complete =
    state.status === "signedIn" && activeRole !== null && !mustCompleteProfile(activeRole, state.user.profileComplete);

  const requireProfile = useCallback(
    (name: string, action: () => void) => {
      if (complete) action();
      else setFeature(name);
    },
    [complete],
  );

  const value = useMemo(() => ({ requireProfile }), [requireProfile]);
  const close = () => setFeature(null);

  function goToProfile() {
    close();
    router.push("/profile");
  }

  return (
    <ProfileGateContext.Provider value={value}>
      {children}
      <Modal visible={feature !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Închide">
          {/* Apăsarea pe card nu închide overlay-ul. */}
          <Pressable style={styles.card} onPress={() => {}} accessibilityRole="alert">
            <IconBubble icon="👤" tone="warning" size={56} />
            <Text style={styles.text}>Completează-ți profilul pentru a {feature}</Text>
            <PrimaryButton label="Completează" onPress={goToProfile} style={styles.button} />
            <SecondaryButton label="Nu acum" onPress={close} style={styles.button} />
          </Pressable>
        </Pressable>
      </Modal>
    </ProfileGateContext.Provider>
  );
}

export function useProfileGate(): ProfileGateValue {
  const ctx = useContext(ProfileGateContext);
  if (!ctx) throw new Error("useProfileGate() trebuie folosit în interiorul <ProfileGateProvider>.");
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: "center",
    ...shadow,
  },
  text: { fontSize: 15, color: colors.textMuted, textAlign: "center", marginTop: 14, lineHeight: 21 },
  button: { alignSelf: "stretch", marginTop: 12 },
});
