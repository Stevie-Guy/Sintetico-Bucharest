import { Redirect, router, Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SecondaryButton } from "@/components/form";
import {
  Card,
  DateBlock,
  EmptyState,
  ErrorState,
  Hint,
  LinkButton,
  LoadingState,
  Screen,
  Segmented,
  uiStyles,
} from "@/components/ui";
import { useProfileGate } from "@/features/profile/profile-gate";
import { useSession } from "@/features/auth/use-session";
import { listMyReservations } from "@/features/reservations/api";
import { ReservationStatusBadge } from "@/features/reservations/status-badge";
import { dateParts, relativeDay } from "@/lib/datetime";
import { reservationStatuses, type ReservationStatus } from "@/lib/labels";
import { useResource } from "@/lib/use-resource";
import { colors } from "@/theme";

const filterOptions = [{ value: "ALL" as const, label: "Toate" }, ...reservationStatuses];

// US-07: rezervările jucătorului și starea lor.
export default function MyReservationsScreen() {
  const session = useSession();
  const { requireProfile } = useProfileGate();
  const [status, setStatus] = useState<ReservationStatus | null>(null);
  const list = useResource(
    () => (session ? listMyReservations(session.token, { status: status ?? undefined }) : Promise.resolve(null)),
    [session?.token, status],
  );

  if (!session) return <Redirect href="/" />;
  const reservations = list.data?.reservations ?? [];

  return (
    <Screen onRefresh={list.reload} refreshing={false}>
      <Stack.Screen options={{ title: "Rezervările mele" }} />
      <Segmented
        options={filterOptions}
        selected={status ?? "ALL"}
        onSelect={(v) => setStatus(v === "ALL" ? null : v)}
      />
      <Hint>Cu o rezervare aprobată poți crea un meci.</Hint>

      {list.loading && !list.data ? (
        <LoadingState />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Nicio rezervare"
          message="Alege un teren ca să rezervi un interval."
          action={<SecondaryButton label="Caută un teren" icon="🏟️" onPress={() => router.push("/fields")} />}
        />
      ) : (
        <View>
          {reservations.map((r) => (
            <Card key={r.id}>
              <View style={styles.row}>
                <DateBlock {...dateParts(r.date)} />
                <View style={styles.body}>
                  <View style={uiStyles.row}>
                    <Text style={styles.title} numberOfLines={1}>
                      {r.field?.nume ?? "Teren"}
                    </Text>
                    <ReservationStatusBadge status={r.status} />
                  </View>
                  <Text style={styles.text}>
                    🕒 {relativeDay(r.date)}, {r.startsAt}–{r.endsAt}
                  </Text>
                  {r.field?.adresa ? (
                    <Text style={styles.muted} numberOfLines={1}>
                      📍 {r.field.adresa}
                    </Text>
                  ) : null}
                </View>
              </View>
              {r.status === "APPROVED" && (
                <View style={styles.action}>
                  <LinkButton label="⚽ Creează un meci ›" onPress={() => requireProfile("crea un meci", () => router.push("/matches/new"))} />
                </View>
              )}
            </Card>
          ))}
          {list.data?.hasMore && <Hint>Se afișează cele mai recente 20 de rezervări.</Hint>}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14 },
  body: { flex: 1, gap: 3 },
  title: { flex: 1, fontSize: 17, fontWeight: "700", color: colors.text },
  text: { fontSize: 15, color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  action: { borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: 10 },
});
