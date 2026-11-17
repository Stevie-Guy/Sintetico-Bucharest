import { Redirect, router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formStyles, PrimaryButton, SecondaryButton } from "@/components/form";
import {
  Badge,
  Card,
  ChipRow,
  DateBlock,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
  Screen,
  uiStyles,
} from "@/components/ui";
import { useSession } from "@/features/auth/use-session";
import { listMatches, type Match } from "@/features/matches/api";
import { getProfile } from "@/features/profile/api";
import { dateParts, dayOf, formatTime, nextDays, relativeDay } from "@/lib/datetime";
import {
  matchCategories,
  matchCategoryLabel,
  profileCategoryToMatch,
  sectorLabel,
  sectors,
  type MatchAgeCategory,
  type Sector,
} from "@/lib/labels";
import { useResource } from "@/lib/use-resource";
import { colors, radius } from "@/theme";

/** API-ul nu are încă filtre pentru meciuri, așa că se încarcă toate meciurile viitoare și se filtrează aici. */
async function loadAllMatches(token: string): Promise<Match[]> {
  const all: Match[] = [];
  for (let page = 1; page <= 20; page++) {
    const result = await listMatches(token, page);
    all.push(...result.matches);
    if (!result.hasMore) break;
  }
  return all;
}

// US-09: meciurile viitoare, cu filtre combinabile după categorie, zi și sector.
export default function MatchesScreen() {
  const session = useSession();
  const [category, setCategory] = useState<MatchAgeCategory | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [sector, setSector] = useState<Sector | null>(null);
  const [onlyFree, setOnlyFree] = useState(false);
  const [categoryPreset, setCategoryPreset] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const matches = useResource(
    () => (session ? loadAllMatches(session.token) : Promise.resolve([])),
    [session?.token],
  );

  // Pentru jucători, filtrul de categorie pornește de la categoria lor din profil.
  useEffect(() => {
    if (!session?.isPlayer || categoryPreset) return;
    setCategoryPreset(true);
    getProfile(session.token)
      .then((p) => {
        const c = p.ageCategory ? profileCategoryToMatch[p.ageCategory] : undefined;
        if (c) setCategory(c);
      })
      .catch(() => {});
  }, [session?.isPlayer, session?.token, categoryPreset]);

  if (!session) return <Redirect href="/" />;

  const days = nextDays(14).map((d) => ({ value: d, label: relativeDay(d) }));

  const filtered = (matches.data ?? []).filter(
    (m) =>
      (!category || m.ageCategory === category) &&
      (!day || dayOf(m.startsAt) === day) &&
      (!sector || m.field.sector === sector) &&
      (!onlyFree || !m.isFull),
  );
  const extraFilters = [day, sector, onlyFree || null].filter(Boolean).length;
  const hasFilters = Boolean(category) || extraFilters > 0;

  function resetFilters() {
    setCategory(null);
    setDay(null);
    setSector(null);
    setOnlyFree(false);
  }

  return (
    <Screen
      onRefresh={matches.reload}
      refreshing={false}
      footer={
        session.isPlayer ? (
          <PrimaryButton label="Creează meci" icon="➕" onPress={() => router.push("/matches/new")} style={styles.footerButton} />
        ) : undefined
      }
    >
      <Stack.Screen options={{ title: "Meciuri" }} />

      <Text style={[formStyles.label, styles.firstLabel]}>Categorie</Text>
      <ChipRow options={matchCategories} selected={category} onSelect={setCategory} allLabel="Toate" scroll />

      <Pressable
        onPress={() => setShowFilters((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: showFilters }}
        style={styles.filterToggle}
      >
        <Text style={styles.filterToggleText}>
          ⚙️ Mai multe filtre{extraFilters > 0 ? ` (${extraFilters})` : ""}
        </Text>
        <Text style={styles.filterToggleText}>{showFilters ? "▲" : "▼"}</Text>
      </Pressable>

      {showFilters && (
        <View style={styles.filters}>
          <Text style={formStyles.label}>Zi</Text>
          <ChipRow options={days} selected={day} onSelect={setDay} allLabel="Oricând" scroll />
          <Text style={formStyles.label}>Locație</Text>
          <ChipRow options={sectors} selected={sector} onSelect={setSector} allLabel="Toate" scroll />
          <ChipRow
            options={[{ value: "free", label: "✓ Doar cu locuri libere" }]}
            selected={onlyFree ? "free" : null}
            onSelect={() => setOnlyFree((v) => !v)}
          />
        </View>
      )}

      {matches.loading && !matches.data ? (
        <LoadingState />
      ) : matches.error ? (
        <ErrorState message={matches.error} onRetry={matches.reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="⚽"
          title={hasFilters ? "Niciun meci găsit" : "Încă nu sunt meciuri"}
          message={
            hasFilters
              ? "Niciun meci nu corespunde filtrelor alese. Încearcă să renunți la unele filtre."
              : "Nu există meciuri viitoare."
          }
          action={hasFilters ? <SecondaryButton label="Șterge filtrele" onPress={resetFilters} /> : undefined}
        />
      ) : (
        <View style={styles.list}>
          <View style={uiStyles.row}>
            <Text style={styles.count}>{filtered.length === 1 ? "1 meci" : `${filtered.length} meciuri`}</Text>
            {hasFilters && (
              <Pressable onPress={resetFilters} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.reset}>Șterge filtrele</Text>
              </Pressable>
            )}
          </View>
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function MatchCard({ match: m }: { match: Match }) {
  const day = dayOf(m.startsAt);
  return (
    <Card onPress={() => router.push({ pathname: "/matches/[id]", params: { id: m.id } })}>
      <View style={styles.cardRow}>
        <DateBlock {...dateParts(day)} />
        <View style={styles.cardBody}>
          <View style={uiStyles.row}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {m.field.nume}
            </Text>
            <Badge label={matchCategoryLabel(m.ageCategory)} />
          </View>
          <Text style={styles.cardTime}>
            🕒 {relativeDay(day)}, {formatTime(m.startsAt)}–{formatTime(m.endsAt)}
          </Text>
          <Text style={styles.cardMuted} numberOfLines={1}>
            📍 {sectorLabel(m.field.sector)} · {m.field.adresa}
          </Text>
        </View>
      </View>
      <View style={styles.places}>
        <ProgressBar value={m.participantCount} max={m.maxPlayers} tone={m.isFull ? "error" : "success"} />
        <Text style={[styles.placesText, m.isFull && { color: colors.error }]}>
          {m.isFull
            ? "Complet"
            : `${m.availablePlaces} ${m.availablePlaces === 1 ? "loc liber" : "locuri libere"} · ${m.participantCount}/${m.maxPlayers}`}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  firstLabel: { marginTop: 0 },
  filterToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 4,
  },
  filterToggleText: { fontSize: 15, fontWeight: "600", color: colors.primaryPressed },
  filters: { marginTop: 4 },
  list: { marginTop: 20, gap: 0 },
  count: { fontSize: 14, fontWeight: "700", color: colors.textMuted, marginBottom: 10 },
  reset: { fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 10 },
  cardRow: { flexDirection: "row", gap: 14 },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: colors.text },
  cardTime: { fontSize: 15, color: colors.text },
  cardMuted: { fontSize: 14, color: colors.textMuted },
  places: { marginTop: 12, gap: 6 },
  placesText: { fontSize: 13, fontWeight: "700", color: colors.primaryPressed },
  footerButton: { marginTop: 8 },
});
