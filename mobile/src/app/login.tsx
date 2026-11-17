import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/api/client";
import { FieldError, FormError, formStyles, PasswordInput, PrimaryButton } from "@/components/form";
import { useAuth } from "@/features/auth/auth-context";
import { colors } from "@/theme";

type FieldErrors = Partial<Record<"email" | "password", string[]>>;

// US-02: autentificare
export default function LoginScreen() {
  const { state, signIn } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (state.status === "signedIn") return <Redirect href="/account" />;

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      await signIn(email, password);
      router.replace("/account");
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fields);
        if (Object.keys(err.fields).length === 0) setFormError(err.message);
      } else {
        setFormError("A apărut o eroare neașteptată. Încearcă din nou.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={formStyles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView style={formStyles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
          <Text style={formStyles.label}>Email</Text>
          <TextInput
            style={[formStyles.input, fieldErrors.email && formStyles.inputError]}
            value={email}
            onChangeText={setEmail}
            placeholder="nume@exemplu.ro"
            placeholderTextColor={colors.disabled}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            accessibilityLabel="Email"
          />
          <FieldError messages={fieldErrors.email} />

          <Text style={formStyles.label}>Parolă</Text>
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            hasError={!!fieldErrors.password}
            autoComplete="current-password"
            textContentType="password"
            accessibilityLabel="Parolă"
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />
          <FieldError messages={fieldErrors.password} />

          <FormError message={formError} />

          <PrimaryButton label="Autentificare" onPress={handleSubmit} disabled={!canSubmit} loading={submitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
