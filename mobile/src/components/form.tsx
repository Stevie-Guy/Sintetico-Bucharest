import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors, radius } from "@/theme";

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

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Emoji afișat înaintea textului. */
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, disabled, loading, icon, style }: ButtonProps) {
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
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={formStyles.buttonText}>{icon ? `${icon}  ${label}` : label}</Text>
      )}
    </Pressable>
  );
}

/** Buton cu contur; `danger` îl colorează în roșu (ex. Deconectare, Respinge). */
export function SecondaryButton({ label, onPress, disabled, loading, icon, style, danger }: ButtonProps & { danger?: boolean }) {
  const color = danger ? colors.error : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        formStyles.secondaryButton,
        { borderColor: disabled && !loading ? colors.border : color },
        pressed && { backgroundColor: danger ? colors.errorLight : colors.primaryLight },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[formStyles.secondaryButtonText, { color: disabled ? colors.disabled : color }]}>
          {icon ? `${icon}  ${label}` : label}
        </Text>
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

  label: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 18, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 52,
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
    padding: 14,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.errorLight,
    color: colors.error,
    fontSize: 15,
  },

  button: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 54,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonPressed: { backgroundColor: colors.primaryPressed },
  buttonDisabled: { backgroundColor: colors.disabled, shadowOpacity: 0, elevation: 0 },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },

  secondaryButton: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 52,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  secondaryButtonText: { color: colors.primary, fontSize: 17, fontWeight: "700" },
});
