import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/theme";

/** Listă de opțiuni din care se alege una singură (ex. tipul de cont, perspectiva adminului). */

export interface Choice<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface ChoiceListProps<T extends string> {
  options: readonly Choice<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
}

export function ChoiceList<T extends string>({ options, selected, onSelect }: ChoiceListProps<T>) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[styles.card, isSelected && styles.cardSelected]}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
          >
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected && <View style={styles.radioDot} />}
            </View>
            <View style={styles.text}>
              <Text style={styles.label}>{option.label}</Text>
              {option.description ? <Text style={styles.description}>{option.description}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: 16,
    backgroundColor: colors.background,
  },
  cardSelected: { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: "#F3FDF6" },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  text: { flex: 1 },
  label: { fontSize: 16, fontWeight: "600", color: colors.text },
  description: { fontSize: 14, color: colors.textMuted, marginTop: 2, lineHeight: 20 },
});
