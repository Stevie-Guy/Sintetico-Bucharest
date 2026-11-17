import { Redirect, router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { FieldError, FormError, formStyles, PrimaryButton, SecondaryButton } from "@/components/form";
import {
  Card,
  ChipRow,
  DateBlock,
  EmptyState,
  ErrorState,
  Hint,
  LoadingState,
  Notice,
  Screen,
  TextField,
} from "@/components/ui";
import { useSession } from "@/features/auth/use-session";
import { createMatch, listEligibleReservations, type EligibleReservation } from "@/features/matches/api";
import { getProfile } from "@/features/profile/api";
import { dateParts, dayOf, formatTime, relativeDay } from "@/lib/datetime";
import { matchCategories, profileCategoryToMatch, type MatchAgeCategory } from "@/lib/labels";
import { errorMessage, useResource } from "@/lib/use-resource";
import { colors } from "@/theme";

const STEP_MINUTES = 15;

/** Orele de început posibile în rezervare: din 15 în 15 minute, doar în viitor. */
function startOptions(r: EligibleReservation): { value: string; label: string }[] {
  const start = new Date(r.startsAtUtc).getTime();
  const end = new Date(r.endsAtUtc).getTime();
  const now = Date.now();
  const options = [];
  for (let t = start; t < end; t += STEP_MINUTES * 60_000) {
    if (t > now) {
      const iso = new Date(t).toISOString();
      options.push({ value: iso, label: formatTime(iso) });
    }
  }
  return options;
}

// US-08: crearea unui meci pe baza unei rezervări proprii aprobate.
export default function NewMatchScreen() {
  const session = useSession();
  const [reservation, setReservation] = useState<EligibleReservation | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [maxPlayers, setMaxPlayers] = useState("");
  const [category, setCategory] = useState<MatchAgeCategory | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const eligible = useResource(
    () => (session ? listEligibleReservations(session.token) : Promise.resolve(null)),
    [session?.token],
  );

  // Categoria pornește de la cea a jucătorului din profil.
  useEffect(() => {
    if (!session?.isPlayer) return;
    getProfile(session.token)
      .then((p) => {
        const c = p.ageCategory ? profileCategoryToMatch[p.ageCategory] : undefined;
        if (c) setCategory((current) => current ?? c);
      })
      .catch(() => {});
  }, [session?.isPlayer, session?.token]);

  if (!session) return <Redirect href="/" />;

  function selectReservation(r: EligibleReservation) {
    setReservation(r);
    setStartsAt(startOptions(r)[0]?.value ?? null);
    setMaxPlayers(String(r.field.numarJucatori));
    setErrors({});
    setFormError(null);
  }

  const playersCount = Number(maxPlayers);
  const differsFromRecommended =
    reservation && Number.isInteger(playersCount) && playersCount > 0 && playersCount !== reservation.field.numarJucatori;

  async function handleCreate() {
    if (!session || !reservation) return;
    setFormError(null);
    const next: Record<string, string[]> = {};
    if (!startsAt) next.startsAt = ["Alege ora de început."];
    if (!Number.isInteger(playersCount) || playersCount < 1) next.maxPlayers = ["Scrie un număr de jucători mai mare ca 0."];
    if (!category) next.ageCategory = ["Alege categoria de vârstă."];
    setErrors(next);
    if (Object.keys(next).length || !startsAt || !category) return;

    setSaving(true);
    try {
      const { match, warnings } = await createMatch(session.token, {
        reservationId: reservation.id,
        startsAt,
        maxPlayers: playersCount,
        ageCategory: category,
      });
      const warning = warnings.map((w) => w.message).join(" ");
      router.replace({ pathname: "/matches/[id]", params: warning ? { id: match.id, warning } : { id: match.id } });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields);
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const reservations = eligible.data?.reservations ?? [];

  return (
    <Screen
      footer={
        reservation ? (
          <PrimaryButton label="Creează meciul" icon="⚽" onPress={handleCreate} loading={saving} style={styles.footerButton} />
        ) : undefined
      }
    >
      <Stack.Screen options={{ title: "Creează meci" }} />
      <Step number={1} title="Alege rezervarea" done={!!reservation} />
      <Hint>Meciul se creează pe un teren rezervat de tine și aprobat de administratorul terenului.</Hint>

      {eligible.loading && !eligible.data ? (
        <LoadingState />
      ) : eligible.error ? (
        <ErrorState message={eligible.error} onRetry={eligible.reload} />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Nicio rezervare disponibilă"
          message="Nu ai rezervări aprobate fără meci. Rezervă întâi un teren și așteaptă aprobarea."
          action={<SecondaryButton label="Caută un teren" icon="🏟️" onPress={() => router.push("/fields")} />}
        />
      ) : (
        reservations.map((r) => {
          const day = dayOf(r.startsAtUtc);
          const selected = reservation?.id === r.id;
          return (
            <Card key={r.id} onPress={() => selectReservation(r)} highlighted={selected}>
              <View style={styles.resRow}>
                <DateBlock {...dateParts(day)} />
                <View style={styles.flex}>
                  <Text style={styles.resTitle} numberOfLines={1}>
                    {r.field.nume}
                  </Text>
                  <Text style={styles.resText}>
                    🕒 {relativeDay(day)}, {formatTime(r.startsAtUtc)}–{formatTime(r.endsAtUtc)}
                  </Text>
                  <Text style={styles.resMuted}>👥 Recomandat: {r.field.numarJucatori} jucători</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioOn]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
              </View>
            </Card>
          );
        })
      )}

      {reservation && (
        <View>
          <Step number={2} title="Detaliile meciului" />
          <Text style={formStyles.label}>Ora de început</Text>
          {startOptions(reservation).length === 0 ? (
            <Notice message="Intervalul acestei rezervări a început deja." tone="error" />
          ) : (
            <ChipRow options={startOptions(reservation)} selected={startsAt} onSelect={setStartsAt} scroll />
          )}
          <FieldError messages={errors.startsAt} />
          <Hint>Meciul se termină odată cu rezervarea, la {formatTime(reservation.endsAtUtc)}.</Hint>

          <TextField
            label="Număr de jucători"
            value={maxPlayers}
            onChangeText={(v) => setMaxPlayers(v.replace(/\D/g, ""))}
            keyboardType="number-pad"
            maxLength={3}
            errors={errors.maxPlayers}
          />
          <Notice
            message={
              differsFromRecommended
                ? `Terenul recomandă ${reservation.field.numarJucatori} jucători. Poți crea meciul și cu ${playersCount}.`
                : null
            }
            tone="warning"
          />

          <Text style={formStyles.label}>Categorie de vârstă</Text>
          <ChipRow options={matchCategories} selected={category} onSelect={setCategory} />
          <FieldError messages={errors.ageCategory} />
          <Hint>Se pot înscrie doar jucătorii din această categorie. Tu nu ești înscris automat.</Hint>

          <FormError message={formError} />
        </View>
      )}
    </Screen>
  );
}

function Step({ number, title, done }: { number: number; title: string; done?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepNumber, done && styles.stepDone]}>
        <Text style={[styles.stepNumberText, done && styles.stepDoneText]}>{done ? "✓" : number}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 3 },
  step: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, marginBottom: 8 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  stepDone: { backgroundColor: colors.primaryLight },
  stepDoneText: { color: colors.primaryPressed },
  stepTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  resRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  resTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  resText: { fontSize: 15, color: colors.text },
  resMuted: { fontSize: 14, color: colors.textMuted },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  footerButton: { marginTop: 8 },
});
