import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { dateParts, todayIso } from "@/lib/datetime";
import { colors, radius } from "@/theme";

/** Rând orizontal cu zilele dintre care se alege una (`AAAA-LL-ZZ`). */
export function DayPicker({ days, selected, onSelect }: { days: string[]; selected: string; onSelect: (day: string) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.box}
    >
      {days.map((day) => {
        const active = day === selected;
        const { weekday, day: number, month } = dateParts(day);
        const isToday = day === todayIso();
        return (
          <Pressable
            key={day}
            onPress={() => onSelect(day)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[styles.day, active && styles.dayActive]}
          >
            <Text style={[styles.weekday, active && styles.textActive]}>{isToday ? "Azi" : weekday}</Text>
            <Text style={[styles.date, active && styles.textActive]}>{number}</Text>
            <Text style={[styles.month, active && styles.textActive]}>{month}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  box: { marginHorizontal: -20, flexGrow: 0 },
  row: { gap: 8, paddingVertical: 4, paddingHorizontal: 20 },
  day: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingVertical: 10,
    width: 60,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  dayActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  weekday: { fontSize: 12, color: colors.textMuted, fontWeight: "700", textTransform: "uppercase" },
  date: { fontSize: 20, color: colors.text, fontWeight: "800", marginTop: 2 },
  month: { fontSize: 12, color: colors.textMuted },
  textActive: { color: "#FFFFFF" },
});
