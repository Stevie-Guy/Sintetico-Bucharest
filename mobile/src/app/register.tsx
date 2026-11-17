import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/api/client";
import { ChoiceList } from "@/components/choice-list";
import { FieldError, FormError, formStyles, PasswordInput, PrimaryButton } from "@/components/form";
import { IconBubble, LinkButton, Title } from "@/components/ui";
import { register, registrationRoles, roleLabel, type RegistrationRole, type User } from "@/features/auth/api";
import { isPasswordValid, passwordRules } from "@/features/auth/password-rules";
import { colors } from "@/theme";

type FieldErrors = Partial<Record<"email" | "password" | "role", string[]>>;

// Verificare rapidă în aplicație; validarea completă a emailului o face backend-ul.
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<RegistrationRole | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<User | null>(null);

  // Confirmarea parolei se verifică doar în aplicație: prinde greșelile de tastare;
  // serverul primește o singură parolă.
  const passwordsMatch = password === confirmPassword;
  const showMismatch = confirmPassword.length > 0 && !passwordsMatch;

  const canSubmit = looksLikeEmail(email) && isPasswordValid(password) && passwordsMatch && role !== null;

  async function handleSubmit() {
    if (!canSubmit || role === null || submitting) return;

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      setCreatedUser(await register({ email: email.trim(), password, role }));
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fields);
        // Mesajul general apare doar dacă nu e deja afișat lângă un câmp.
        if (Object.keys(err.fields).length === 0) setFormError(err.message);
      } else {
        setFormError("A apărut o eroare neașteptată. Încearcă din nou.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (createdUser) {
    return (
      <SafeAreaView style={formStyles.safe} edges={["bottom"]}>
        <View style={styles.success}>
          <IconBubble icon="🎉" size={80} />
          <Text style={styles.successTitle}>Contul a fost creat</Text>
          <Text style={styles.successText}>
            Contul de {roleLabel(createdUser.role).toLowerCase()} pentru {createdUser.email} este gata.
          </Text>
          <PrimaryButton
            label="Autentifică-te"
            onPress={() => router.replace({ pathname: "/login", params: { email: createdUser.email } })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={formStyles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView style={formStyles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
          <Title subtitle="Durează mai puțin de un minut.">Creează-ți contul ⚽</Title>

          <Text style={formStyles.label}>Ce fel de cont vrei?</Text>
          <ChoiceList
            options={registrationRoles}
            selected={role}
            onSelect={(value) => {
              setRole(value);
              setFieldErrors((e) => ({ ...e, role: undefined }));
            }}
          />
          <FieldError messages={fieldErrors.role} />

          <Text style={formStyles.label}>Email</Text>
          <TextInput
            style={[formStyles.input, fieldErrors.email && formStyles.inputError]}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setFieldErrors((e) => ({ ...e, email: undefined }));
            }}
            placeholder="nume@exemplu.ro"
            placeholderTextColor={colors.disabled}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel="Email"
          />
          <FieldError messages={fieldErrors.email} />

          <Text style={formStyles.label}>Parolă</Text>
          <PasswordInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setFieldErrors((e) => ({ ...e, password: undefined }));
            }}
            hasError={!!fieldErrors.password}
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel="Parolă"
          />
          <View style={styles.rules}>
            {passwordRules.map((rule) => {
              const ok = rule.test(password);
              return (
                <Text key={rule.id} style={[styles.rule, ok && styles.ruleOk]}>
                  {ok ? "✓" : "•"} {rule.label}
                </Text>
              );
            })}
          </View>
          <FieldError messages={fieldErrors.password} />

          <Text style={formStyles.label}>Confirmă parola</Text>
          <PasswordInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            hasError={showMismatch}
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel="Confirmă parola"
          />
          <FieldError messages={showMismatch ? ["Parolele nu coincid."] : undefined} />

          <FormError message={formError} />

          <PrimaryButton label="Creează cont" onPress={handleSubmit} disabled={!canSubmit} loading={submitting} />
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Ai deja cont?</Text>
            <LinkButton label="Autentifică-te" onPress={() => router.replace("/login")} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rules: { marginTop: 10, gap: 4, padding: 12, borderRadius: 12, backgroundColor: colors.background },
  rule: { fontSize: 14, color: colors.textMuted },
  ruleOk: { color: colors.primary, fontWeight: "600" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 },
  switchText: { fontSize: 15, color: colors.textMuted },

  success: { flex: 1, justifyContent: "center", alignItems: "stretch", padding: 24, gap: 12, width: "100%", maxWidth: 520, alignSelf: "center" },
  successTitle: { fontSize: 26, fontWeight: "800", color: colors.primary, marginTop: 8 },
  successText: { fontSize: 16, lineHeight: 23, color: colors.text },
});
