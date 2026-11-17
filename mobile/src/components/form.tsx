import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "@/theme";

/** Componente comune pentru formulare (creare cont, autentificare etc.). */

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <View style={formStyles.fieldError}>
      {messages.map((m) => (
        <Text key={m} style={formStyles.fieldErrorText}>
          {m}
        </Text>
      ))}
    </View>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Text style={formStyles.formError} accessibilityRole="alert">
      {message}
    </Text>
  );
}

type ButtonProps = { label: string; onPress: () => void; disabled?: boolean; loading?: boolean };

export function PrimaryButton({ label, onPress, disabled, loading }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        formStyles.button,
        pressed && formStyles.buttonPressed,
        disabled && !loading && formStyles.buttonDisabled,
      ]}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={formStyles.buttonText}>{label}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, loading }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [formStyles.secondaryButton, pressed && formStyles.secondaryButtonPressed]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text style={formStyles.secondaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Câmp de parolă cu buton „Arată / Ascunde”. */
export function PasswordInput({ hasError, ...props }: TextInputProps & { hasError?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={formStyles.passwordRow}>
      <TextInput
        {...props}
        style={[formStyles.input, formStyles.passwordInput, hasError && formStyles.inputError]}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.disabled}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        style={formStyles.toggle}
        accessibilityRole="button"
        accessibilityLabel={visible ? "Ascunde parola" : "Arată parola"}
      >
        <Text style={formStyles.toggleText}>{visible ? "Ascunde" : "Arată"}</Text>
      </Pressable>
    </View>
  );
}

export const formStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, width: "100%", maxWidth: 520, alignSelf: "center" },

  label: { fontSize: 15, fontWeight: "600", color: colors.text, marginTop: 20, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 50,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.error },

  passwordRow: { flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, paddingRight: 80 },
  toggle: { position: "absolute", right: 4, paddingHorizontal: 12, minHeight: 44, justifyContent: "center" },
  toggleText: { color: colors.primary, fontWeight: "600", fontSize: 15 },

  fieldError: { marginTop: 6, gap: 2 },
  fieldErrorText: { color: colors.error, fontSize: 14 },
  formError: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.errorLight,
    color: colors.error,
    fontSize: 15,
  },

  button: {
    marginTop: 28,
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: { backgroundColor: colors.primaryPressed },
  buttonDisabled: { backgroundColor: colors.disabled },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },

  secondaryButton: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  secondaryButtonPressed: { backgroundColor: colors.primaryLight },
  secondaryButtonText: { color: colors.primary, fontSize: 17, fontWeight: "700" },
});
