import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FieldError, formStyles } from "@/components/form";
import { colors, radius, shadow } from "@/theme";

/**
 * Componente comune pentru ecranele aplicației (liste, carduri, filtre, stări goale).
 * Iconițele sunt emoji, ca să nu adăugăm o bibliotecă de iconițe.
 */

export function Screen({
  children,
  onRefresh,
  refreshing = false,
  footer,
}: {
  children: ReactNode;
  /** Dacă e dat, lista se poate reîncărca trăgând în jos. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Acțiunea principală a ecranului, fixată jos, mereu la îndemână. */
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={formStyles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={styles.footer}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export function Title({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <View style={styles.titleBox}>
      <Text style={styles.title}>{children}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/** Titlu de secțiune, cu o acțiune opțională în dreapta (ex. „Vezi toate”). */
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action ? (
        <Pressable onPress={action.onPress} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.linkText}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <Text style={styles.hint}>{children}</Text>;
}

export function Card({
  children,
  onPress,
  highlighted,
}: {
  children: ReactNode;
  onPress?: () => void;
  highlighted?: boolean;
}) {
  const style = [styles.card, highlighted && styles.cardHighlighted];
  if (!onPress) return <View style={style}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [...style, pressed && styles.cardPressed]}
    >
      {children}
    </Pressable>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.cardTitle} numberOfLines={2}>
      {children}
    </Text>
  );
}

export function CardText({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.cardText, muted && styles.muted]}>{children}</Text>;
}

/** Emoji într-un cerc colorat. */
export function IconBubble({ icon, tone = "success", size = 44 }: { icon: string; tone?: Tone; size?: number }) {
  return (
    <View
      style={[
        styles.bubble,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: toneColors[tone].bg },
      ]}
    >
      <Text style={{ fontSize: size * 0.45 }}>{icon}</Text>
    </View>
  );
}

/** Rând de listă: iconiță, titlu, subtitlu, ceva în dreapta și săgeată dacă se poate apăsa. */
export function ListItem({
  icon,
  tone,
  title,
  subtitle,
  right,
  onPress,
  highlighted,
}: {
  icon?: string;
  tone?: Tone;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  highlighted?: boolean;
}) {
  return (
    <Card onPress={onPress} highlighted={highlighted}>
      <View style={styles.listItem}>
        {icon ? <IconBubble icon={icon} tone={tone} /> : null}
        <View style={styles.flex}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.cardText, styles.muted]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
        {onPress ? <Text style={styles.chevron}>›</Text> : null}
      </View>
    </Card>
  );
}

/** Bloc de dată pentru carduri: ziua săptămânii, ziua și luna, unul sub altul. */
export function DateBlock({ weekday, day, month }: { weekday: string; day: string; month: string }) {
  return (
    <View style={styles.dateBlock}>
      <Text style={styles.dateWeekday}>{weekday}</Text>
      <Text style={styles.dateDay}>{day}</Text>
      <Text style={styles.dateMonth}>{month}</Text>
    </View>
  );
}

/** Bară de progres, ex. locurile ocupate dintr-un meci. */
export function ProgressBar({ value, max, tone = "success" }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const fill = tone === "error" ? colors.error : tone === "warning" ? "#D97706" : colors.primary;
  return (
    <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: fill }]} />
    </View>
  );
}

/** Cerc cu inițialele numelui. */
export function Avatar({ name, size = 40, highlighted }: { name: string | null; size?: number; highlighted?: boolean }) {
  const initials =
    (name ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?";
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        highlighted && { backgroundColor: colors.primary },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }, highlighted && { color: "#FFFFFF" }]}>
        {initials}
      </Text>
    </View>
  );
}

/** Etichetă + valoare; cu `icon` se afișează pe un rând, cu iconița în stânga. */
export function InfoRow({ label, value, icon }: { label: string; value: ReactNode; icon?: string }) {
  if (icon) {
    return (
      <View style={styles.infoRowIcon}>
        <Text style={styles.infoIcon}>{icon}</Text>
        <View style={styles.flex}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export type Tone = "neutral" | "success" | "warning" | "error";

const toneColors: Record<Tone, { bg: string; fg: string; icon: string }> = {
  neutral: { bg: colors.borderLight, fg: colors.text, icon: "ℹ️" },
  success: { bg: colors.primaryLight, fg: colors.primaryPressed, icon: "✅" },
  warning: { bg: colors.warningLight, fg: colors.warning, icon: "⚠️" },
  error: { bg: colors.errorLight, fg: colors.error, icon: "⛔" },
};

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const c = toneColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

/**
 * Mesaj în chenar colorat (confirmare, avertisment, eroare). `message` poate conține și
 * `<Text onPress>` imbricat, de ex. un link subliniat.
 */
export function Notice({ message, tone = "neutral" }: { message: ReactNode; tone?: Tone }) {
  if (!message) return null;
  const c = toneColors[tone];
  return (
    <View style={[styles.notice, { backgroundColor: c.bg }]} accessibilityRole="alert">
      <Text style={styles.noticeIcon}>{c.icon}</Text>
      <Text style={[styles.noticeText, { color: c.fg }]}>{message}</Text>
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function EmptyState({
  message,
  title,
  icon = "🔍",
  action,
}: {
  message: string;
  title?: string;
  icon?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <IconBubble icon={icon} tone="neutral" size={64} />
      {title ? <Text style={styles.emptyTitle}>{title}</Text> : null}
      <Text style={styles.emptyText}>{message}</Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>⛔ {message}</Text>
      <Pressable onPress={onRetry} accessibilityRole="button" style={styles.retry}>
        <Text style={[styles.linkText, { color: colors.error }]}>↻ Încearcă din nou</Text>
      </Pressable>
    </View>
  );
}

/**
 * Rând de opțiuni compacte; `allLabel` adaugă o opțiune „Toate” care înseamnă fără filtru.
 * Cu `scroll`, opțiunile stau pe un singur rând care se derulează orizontal.
 */
export function ChipRow<T extends string>({
  options,
  selected,
  onSelect,
  allLabel,
  scroll,
}: {
  options: readonly { value: T; label: string }[];
  selected: T | null;
  onSelect: (value: T | null) => void;
  allLabel?: string;
  scroll?: boolean;
}) {
  const all = allLabel ? [{ value: null as T | null, label: allLabel }] : [];
  const chips = [...all, ...options].map((o) => {
    const active = selected === o.value;
    return (
      <Pressable
        key={o.value ?? "__all"}
        onPress={() => onSelect(o.value)}
        accessibilityRole="radio"
        accessibilityState={{ checked: active }}
        style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && !active && styles.chipPressed]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
      </Pressable>
    );
  });
  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
        style={styles.chipsScrollBox}
      >
        {chips}
      </ScrollView>
    );
  }
  return <View style={styles.chips}>{chips}</View>;
}

/** Comutator între 2–3 opțiuni egale (ex. stările rezervărilor). */
export function Segmented<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: readonly { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <Pressable
            key={o.value}
            onPress={() => onSelect(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Câmp de formular cu etichetă, indicație și erorile venite de la server. */
export function TextField({
  label,
  hint,
  errors,
  ...props
}: TextInputProps & { label: string; hint?: string; errors?: string[] }) {
  return (
    <View>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        {...props}
        style={[formStyles.input, errors?.length ? formStyles.inputError : null]}
        placeholderTextColor={colors.disabled}
        accessibilityLabel={label}
      />
      {hint && !errors?.length ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      <FieldError messages={errors} />
    </View>
  );
}

export function LinkButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.linkButton} hitSlop={6}>
      <Text style={[styles.linkText, danger && { color: colors.error }]}>{label}</Text>
    </Pressable>
  );
}

export const uiStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rowStart: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  buttonsRow: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  footerInner: { width: "100%", maxWidth: 520, alignSelf: "center" },

  titleBox: { marginTop: 4, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 4, lineHeight: 21 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  hint: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginBottom: 12 },

  card: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    padding: 16,
    backgroundColor: colors.background,
    marginBottom: 12,
    gap: 4,
    ...shadow,
  },
  cardHighlighted: { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: "#F3FDF6" },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  cardText: { fontSize: 15, color: colors.text, lineHeight: 21 },
  muted: { color: colors.textMuted },

  bubble: { alignItems: "center", justifyContent: "center" },
  listItem: { flexDirection: "row", alignItems: "center", gap: 14 },
  chevron: { fontSize: 26, color: colors.disabled, marginLeft: 2, marginTop: -2 },

  dateBlock: {
    width: 58,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
  },
  dateWeekday: { fontSize: 12, fontWeight: "700", color: colors.primaryPressed, textTransform: "uppercase" },
  dateDay: { fontSize: 22, fontWeight: "800", color: colors.primaryPressed, lineHeight: 26 },
  dateMonth: { fontSize: 12, color: colors.primaryPressed },

  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.borderLight, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4 },

  avatar: { backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800", color: colors.primaryPressed },

  infoRow: { marginBottom: 12 },
  infoRowIcon: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  infoIcon: { fontSize: 20, width: 28, textAlign: "center" },
  infoLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  infoValue: { fontSize: 16, color: colors.text, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 8 },

  badge: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 13, fontWeight: "700" },
  notice: { marginTop: 16, padding: 14, borderRadius: radius.md, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  noticeIcon: { fontSize: 16, lineHeight: 21 },
  noticeText: { flex: 1, fontSize: 15, lineHeight: 21, fontWeight: "500" },

  center: { paddingVertical: 48, alignItems: "center" },
  empty: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 12, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 6, textAlign: "center" },
  emptyText: { fontSize: 15, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  emptyAction: { alignSelf: "stretch" },
  errorBox: { padding: 16, borderRadius: radius.md, backgroundColor: colors.errorLight, marginVertical: 12 },
  errorText: { color: colors.error, fontSize: 15, lineHeight: 21 },
  retry: { marginTop: 8, minHeight: 36, justifyContent: "center" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chipsScrollBox: { marginHorizontal: -20, marginBottom: 8, flexGrow: 0 },
  chipsScroll: { gap: 8, paddingHorizontal: 20 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipPressed: { backgroundColor: colors.primaryLight },
  chipText: { fontSize: 15, color: colors.text, fontWeight: "500" },
  chipTextActive: { color: "#FFFFFF", fontWeight: "700" },

  segmented: {
    flexDirection: "row",
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: 12,
  },
  segment: { flex: 1, minHeight: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  segmentActive: { backgroundColor: colors.background, ...shadow },
  segmentText: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
  segmentTextActive: { color: colors.primaryPressed, fontWeight: "700" },

  fieldHint: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  linkButton: { minHeight: 44, justifyContent: "center" },
  linkText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
});
