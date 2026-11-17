import { Redirect, router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/form";
import { DayPicker } from "@/components/day-picker";
import {
  Badge,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Hint,
  InfoRow,
  ListItem,
  LoadingState,
  Notice,
  Screen,
  SectionTitle,
  Title,
} from "@/components/ui";
import { useProfileGate } from "@/features/profile/profile-gate";
import { useSession } from "@/features/auth/use-session";
import { getField, getOperatingHours, listAvailability, type AvailabilityInterval } from "@/features/fields/api";
import { createReservation } from "@/features/reservations/api";
import { formatDay, nextDays, relativeDay } from "@/lib/datetime";
import { sectorLabel } from "@/lib/labels";
import { errorMessage, useResource } from "@/lib/use-resource";
import { colors, radius } from "@/theme";

const DAYS = 14;

// Detaliile unui teren. Jucătorul vede intervalele libere și rezervă (US-07);
// proprietarul ajunge de aici la editare, program și rezervări (US-05, US-06).
export default function FieldScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession();
  const { requireProfile } = useProfileGate();
  const days = nextDays(DAYS);
  const [day, setDay] = useState(days[0]);
  const [reserving, setReserving] = useState(false);
  // Intervalul ales; cererea se trimite abia la apăsarea butonului de jos (confirmarea).
  const [selected, setSelected] = useState<AvailabilityInterval | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  const details = useResource(async () => {
    if (!session) return null;
    const [field, hours] = await Promise.all([getField(session.token, id), getOperatingHours(session.token, id)]);
    return { field, hours };
  }, [session?.token, id]);

  const slots = useResource(
    () => (session ? listAvailability(session.token, id, day) : Promise.resolve([])),
    [session?.token, id, day],
  );

  if (!session) return <Redirect href="/" />;

  const field = details.data?.field;
  const hours = details.data?.hours;
  const isOwner = field?.adminId === session.user.id;

  async function reserve(interval: AvailabilityInterval) {
    if (!session) return;
    setReserving(true);
    setMessage(null);
    try {
      await createReservation(session.token, id, { availabilityId: interval.id, expectedVersion: interval.version });
      setMessage({
        text: `Ai cerut rezervarea pentru ${formatDay(interval.date)}, ${interval.startsAt}–${interval.endsAt}. Primești o notificare când administratorul terenului o aprobă.`,
        tone: "success",
      });
    } catch (err) {
      setMessage({ text: errorMessage(err), tone: "error" });
    } finally {
      setReserving(false);
      setSelected(null);
      slots.reload();
    }
  }

  const footer =
    session.isPlayer && selected ? (
      <View>
        <Text style={styles.footerHint}>
          {relativeDay(selected.date)}, {selected.startsAt}–{selected.endsAt}
        </Text>
        <PrimaryButton
          label="Trimite cererea de rezervare"
          onPress={() => requireProfile("rezerva un teren", () => reserve(selected))}
          loading={reserving}
          style={styles.footerButton}
        />
      </View>
    ) : undefined;

  return (
    <Screen footer={footer}>
      <Stack.Screen options={{ title: field?.nume ?? "Teren" }} />
      {details.loading && !details.data ? (
        <LoadingState />
      ) : details.error && !details.data ? (
        <ErrorState message={details.error} onRetry={details.reload} />
      ) : field ? (
        <View>
          <View style={styles.badgeRow}>
            <Badge label={sectorLabel(field.sector)} tone="success" />
            {isOwner && <Badge label="Terenul tău" />}
          </View>
          <Title>{field.nume}</Title>
          <Card>
            <InfoRow icon="📍" label="Adresă" value={`${field.adresa}, ${sectorLabel(field.sector)}`} />
            <Divider />
            <InfoRow icon="👥" label="Jucători recomandați" value={String(field.numarJucatori)} />
            <Divider />
            <InfoRow icon="🕒" label="Program" value={hours ? `Zilnic, ${hours.opensAt}–${hours.closesAt}` : "Nesetat"} />
          </Card>

          {isOwner && (
            <View>
              <SectionTitle>Administrare</SectionTitle>
              <ListItem
                icon="🗓️"
                title="Program și intervale"
                subtitle="Când se poate rezerva terenul"
                onPress={() => router.push({ pathname: "/fields/[id]/schedule", params: { id } })}
              />
              <ListItem
                icon="📥"
                title="Cereri de rezervare"
                subtitle="Aprobă sau respinge cererile"
                onPress={() => router.push({ pathname: "/fields/[id]/reservations", params: { id } })}
              />
              <ListItem
                icon="✏️"
                tone="neutral"
                title="Editează terenul"
                subtitle="Nume, adresă, sector, jucători"
                onPress={() => requireProfile("edita terenul", () => router.push({ pathname: "/fields/[id]/edit", params: { id } }))}
              />
            </View>
          )}

          {session.isPlayer && (
            <View>
              <SectionTitle>Rezervă un interval</SectionTitle>
              <Hint>Alege ziua, apoi un interval liber. Cererea ajunge la administratorul terenului.</Hint>
              <DayPicker
                days={days}
                selected={day}
                onSelect={(d) => {
                  setDay(d);
                  setSelected(null);
                }}
              />
              <Notice message={message?.text ?? null} tone={message?.tone} />

              {slots.loading && !slots.data ? (
                <LoadingState />
              ) : slots.error ? (
                <ErrorState message={slots.error} onRetry={slots.reload} />
              ) : !slots.data?.length ? (
                <EmptyState icon="📅" message={`Nu există intervale libere ${formatDay(day)}. Încearcă altă zi.`} />
              ) : (
                <View style={styles.slots}>
                  {slots.data.map((slot) => {
                    const active = selected?.id === slot.id;
                    return (
                      <Pressable
                        key={slot.id}
                        onPress={() => setSelected(active ? null : slot)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        style={({ pressed }) => [styles.slot, active && styles.slotActive, pressed && !active && styles.slotPressed]}
                      >
                        <Text style={[styles.slotText, active && styles.slotTextActive]}>
                          {slot.startsAt}–{slot.endsAt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 6 },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  slot: {
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  slotActive: { backgroundColor: colors.primary },
  slotPressed: { backgroundColor: colors.primaryLight },
  slotText: { fontSize: 16, fontWeight: "700", color: colors.primaryPressed },
  slotTextActive: { color: "#FFFFFF" },
  footerHint: { fontSize: 14, color: colors.textMuted, textAlign: "center", marginTop: 8 },
  footerButton: { marginTop: 8 },
});
