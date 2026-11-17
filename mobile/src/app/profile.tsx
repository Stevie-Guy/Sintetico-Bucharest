import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { FormError, formStyles, PrimaryButton } from "@/components/form";
import { Avatar, Badge, Card, ChipRow, ErrorState, Hint, LoadingState, Notice, Screen, SectionTitle, TextField } from "@/components/ui";
import { useSession } from "@/features/auth/use-session";
import { getProfile, updateProfile, type PlayerProfile } from "@/features/profile/api";
import { isValidDate, todayIso } from "@/lib/datetime";
import { feet, positions, type DominantFoot, type PlayerPosition } from "@/lib/labels";
import { errorMessage, useResource } from "@/lib/use-resource";
import { colors } from "@/theme";

// US-03: editare profil. US-04: categoria de vârstă, calculată de server din data nașterii (doar afișată).
export default function ProfileScreen() {
  const session = useSession();
  const profile = useResource(
    () => (session ? getProfile(session.token) : Promise.resolve(null)),
    [session?.token],
  );

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [position, setPosition] = useState<PlayerPosition | null>(null);
  const [foot, setFoot] = useState<DominantFoot | null>(null);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Formularul se completează o singură dată, la prima încărcare, ca reîncărcarea să nu șteargă ce scrii.
  useEffect(() => {
    if (profile.data && loadedId !== profile.data.id) {
      fill(profile.data);
      setLoadedId(profile.data.id);
    }
  }, [profile.data, loadedId]);

  function fill(p: PlayerProfile) {
    setName(p.name ?? "");
    setDateOfBirth(p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "");
    setPosition(p.preferredPosition);
    setFoot(p.dominantFoot);
    setPhone(p.phoneNumber ?? "");
  }

  if (!session) return <Redirect href="/" />;

  async function handleSave() {
    if (!session) return;
    setSaved(false);
    setFormError(null);

    const errors: Record<string, string[]> = {};
    const dob = dateOfBirth.trim();
    if (dob && !isValidDate(dob)) errors.dateOfBirth = ["Scrie data în formatul AAAA-LL-ZZ, de ex. 2001-05-23."];
    else if (dob && dob > todayIso()) errors.dateOfBirth = ["Data nașterii nu poate fi în viitor."];
    const phoneValue = phone.replace(/\s/g, "");
    if (phoneValue && !/^\+40\d{9}$/.test(phoneValue)) {
      errors.phoneNumber = ["Numărul trebuie să aibă formatul +40 urmat de 9 cifre."];
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      const updated = await updateProfile(session.token, {
        name: name.trim() || null,
        dateOfBirth: dob || null,
        preferredPosition: position,
        dominantFoot: foot,
        phoneNumber: phoneValue || null,
      });
      profile.setData(updated);
      fill(updated);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setFieldErrors(err.fields);
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      footer={
        profile.data ? (
          <PrimaryButton label="Salvează profilul" onPress={handleSave} loading={saving} style={styles.footerButton} />
        ) : undefined
      }
    >
      <Stack.Screen options={{ title: "Profilul meu" }} />
      {profile.loading && !profile.data ? (
        <LoadingState />
      ) : profile.error && !profile.data ? (
        <ErrorState message={profile.error} onRetry={profile.reload} />
      ) : profile.data ? (
        <View>
          <Card>
            <View style={styles.header}>
              <Avatar name={profile.data.name ?? profile.data.email} size={64} highlighted />
              <View style={styles.headerText}>
                <Text style={styles.name} numberOfLines={1}>
                  {profile.data.name ?? "Fără nume"}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {profile.data.email}
                </Text>
                {profile.data.ageCategory ? (
                  <Badge label={`Categoria ${profile.data.ageCategory}`} tone="success" />
                ) : (
                  <Badge label="Categorie necunoscută" tone="warning" />
                )}
              </View>
            </View>
          </Card>
          <Hint>
            {profile.data.ageCategory
              ? "Categoria se calculează automat din data nașterii și nu se poate edita."
              : "Completează data nașterii ca să afli categoria și să te poți înscrie la meciuri."}
          </Hint>

          <SectionTitle>Date personale</SectionTitle>
          <TextField
            label="Nume"
            value={name}
            onChangeText={setName}
            placeholder="Numele afișat celorlalți jucători"
            maxLength={128}
            errors={fieldErrors.name}
          />
          <TextField
            label="Data nașterii"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="AAAA-LL-ZZ"
            hint="Ex. 2001-05-23"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            errors={fieldErrors.dateOfBirth}
          />

          <SectionTitle>Pe teren</SectionTitle>
          <Text style={[formStyles.label, styles.firstLabel]}>Poziție preferată</Text>
          <ChipRow options={positions} selected={position} onSelect={setPosition} allLabel="Nespecificat" />

          <Text style={formStyles.label}>Picior dominant</Text>
          <ChipRow options={feet} selected={foot} onSelect={setFoot} allLabel="Nespecificat" />

          <SectionTitle>Contact</SectionTitle>
          <TextField
            label="Telefon"
            value={phone}
            onChangeText={setPhone}
            placeholder="+40712345678"
            keyboardType="phone-pad"
            maxLength={16}
            errors={fieldErrors.phoneNumber}
          />

          <FormError message={formError} />
          <Notice message={saved ? "Profilul a fost salvat." : null} tone="success" />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerText: { flex: 1, gap: 4 },
  name: { fontSize: 20, fontWeight: "800", color: colors.text },
  email: { fontSize: 14, color: colors.textMuted },
  firstLabel: { marginTop: 0 },
  footerButton: { marginTop: 8 },
});
