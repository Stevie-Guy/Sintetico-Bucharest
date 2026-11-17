import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton, SecondaryButton } from "@/components/form";
import {
  Avatar,
  Card,
  DateBlock,
  EmptyState,
  ErrorState,
  Hint,
  LoadingState,
  Notice,
  Screen,
  Segmented,
  uiStyles,
} from "@/components/ui";
import { useSession } from "@/features/auth/use-session";
import { decideReservation, listFieldReservations, type Reservation } from "@/features/reservations/api";
import { dateParts, formatDay, relativeDay } from "@/lib/datetime";
import { reservationStatuses, type ReservationStatus } from "@/lib/labels";
import { errorMessage, useResource } from "@/lib/use-resource";
import { ReservationStatusBadge } from "@/features/reservations/status-badge";
import { colors } from "@/theme";

const filterOptions = [{ value: "ALL" as const, label: "Toate" }, ...reservationStatuses];

// US-07: proprietarul terenului aprobă sau respinge cererile de rezervare.
export default function FieldReservationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession();
  const [status, setStatus] = useState<ReservationStatus | null>("PENDING");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  const list = useResource(
    () => (session ? listFieldReservations(session.token, id, { status: status ?? undefined }) : Promise.resolve(null)),
    [session?.token, id, status],
  );

  if (!session) return <Redirect href="/" />;

  async function decide(r: Reservation, decision: "APPROVED" | "REJECTED") {
    if (!session) return;
    setBusy(r.id + decision);
    setMessage(null);
    try {
      await decideReservation(session.token, id, r.id, decision);
      setMessage({
        text: `Rezervarea din ${formatDay(r.date)}, ${r.startsAt}–${r.endsAt} a fost ${decision === "APPROVED" ? "aprobată" : "respinsă"}. Jucătorul primește o notificare.`,
        tone: "success",
      });
      list.reload();
    } catch (err) {
      setMessage({ text: errorMessage(err), tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  const reservations = list.data?.reservations ?? [];

  return (
    <Screen onRefresh={list.reload} refreshing={false}>
      <Stack.Screen options={{ title: "Cereri de rezervare" }} />
      <Hint>O cerere în așteptare blochează intervalul. Dacă o respingi, intervalul redevine liber.</Hint>
      <Segmented
        options={filterOptions}
        selected={status ?? "ALL"}
        onSelect={(v) => setStatus(v === "ALL" ? null : v)}
      />
      <Notice message={message?.text ?? null} tone={message?.tone} />

      {list.loading && !list.data ? (
        <LoadingState />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon="📥"
          message={status === "PENDING" ? "Nu ai cereri în așteptare. Totul e la zi!" : "Nu există rezervări."}
        />
      ) : (
        <View style={{ marginTop: 12 }}>
          {reservations.map((r) => (
            <Card key={r.id}>
              <View style={styles.row}>
                <DateBlock {...dateParts(r.date)} />
                <View style={styles.body}>
                  <View style={uiStyles.row}>
                    <Text style={styles.time}>
                      {r.startsAt}–{r.endsAt}
                    </Text>
                    <ReservationStatusBadge status={r.status} />
                  </View>
                  <Text style={styles.muted}>{relativeDay(r.date)}</Text>
                  <View style={styles.player}>
                    <Avatar name={r.player?.name ?? null} size={26} />
                    <Text style={styles.playerName} numberOfLines={1}>
                      {r.player?.name ?? "Jucător fără nume în profil"}
                    </Text>
                  </View>
                </View>
              </View>
              {r.status === "PENDING" && (
                <View style={uiStyles.buttonsRow}>
                  <View style={uiStyles.flex}>
                    <SecondaryButton
                      label="Respinge"
                      danger
                      onPress={() => decide(r, "REJECTED")}
                      loading={busy === r.id + "REJECTED"}
                      disabled={busy !== null}
                    />
                  </View>
                  <View style={uiStyles.flex}>
                    <PrimaryButton
                      label="Aprobă"
                      onPress={() => decide(r, "APPROVED")}
                      loading={busy === r.id + "APPROVED"}
                      disabled={busy !== null}
                      style={styles.approve}
                    />
                  </View>
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
  time: { fontSize: 18, fontWeight: "800", color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  player: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  playerName: { flex: 1, fontSize: 15, color: colors.text },
  approve: { marginTop: 12, minHeight: 52 },
});
