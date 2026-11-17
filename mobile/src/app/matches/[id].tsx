import { Redirect, router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { PrimaryButton, SecondaryButton } from "@/components/form";
import {
  Avatar,
  Badge,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  InfoRow,
  LoadingState,
  Notice,
  ProgressBar,
  Screen,
  SectionTitle,
  Title,
} from "@/components/ui";
import { useSession } from "@/features/auth/use-session";
import { getMatch, joinMatch, listParticipants } from "@/features/matches/api";
import { dayOf, formatDay, formatTime } from "@/lib/datetime";
import { matchCategoryLabel, sectorLabel } from "@/lib/labels";
import { errorMessage, useResource } from "@/lib/use-resource";
import { colors } from "@/theme";

// US-08/US-10: detaliile meciului, lista participanților și înscrierea.
export default function MatchScreen() {
  const { id, warning } = useLocalSearchParams<{ id: string; warning?: string }>();
  const session = useSession();
  const [joining, setJoining] = useState(false);
  const [result, setResult] = useState<{ text: string; tone: "success" | "error"; needsProfile?: boolean } | null>(null);

  const data = useResource(async () => {
    if (!session) return null;
    const [match, participants] = await Promise.all([
      getMatch(session.token, id),
      listParticipants(session.token, id),
    ]);
    return { match, participants };
  }, [session?.token, id]);

  if (!session) return <Redirect href="/" />;

  const match = data.data?.match;
  const participants = data.data?.participants ?? [];
  const joined = participants.some((p) => p.user.id === session.user.id);
  const started = match ? new Date(match.startsAt) <= new Date() : false;

  async function handleJoin() {
    if (!session) return;
    setJoining(true);
    setResult(null);
    try {
      await joinMatch(session.token, id);
      setResult({ text: "Te-ai înscris la meci.", tone: "success" });
      data.reload();
    } catch (err) {
      const needsProfile = err instanceof ApiError && err.code === "DATE_OF_BIRTH_REQUIRED";
      setResult({ text: errorMessage(err), tone: "error", needsProfile });
      data.reload();
    } finally {
      setJoining(false);
    }
  }

  // Acțiunea jucătorului stă jos, fixată, ca să se vadă fără derulare.
  let footer = null;
  if (match && session.isPlayer) {
    footer = joined ? (
      <View style={styles.status}>
        <Text style={[styles.statusText, { color: colors.primaryPressed }]}>✅ Ești înscris la acest meci</Text>
      </View>
    ) : started ? (
      <View style={styles.status}>
        <Text style={styles.statusText}>Meciul a început; nu mai e posibilă înscrierea.</Text>
      </View>
    ) : match.isFull ? (
      <View style={styles.status}>
        <Text style={styles.statusText}>Meciul nu mai are locuri libere.</Text>
      </View>
    ) : (
      <PrimaryButton label="Înscrie-te la meci" icon="⚽" onPress={handleJoin} loading={joining} style={styles.footerButton} />
    );
  }

  return (
    <Screen onRefresh={data.reload} refreshing={false} footer={footer}>
      <Stack.Screen options={{ title: "Meci" }} />
      <Notice message={warning ?? null} tone="warning" />
      {data.loading && !data.data ? (
        <LoadingState />
      ) : data.error && !data.data ? (
        <ErrorState message={data.error} onRetry={data.reload} />
      ) : match ? (
        <View>
          <View style={styles.titleRow}>
            <Badge label={matchCategoryLabel(match.ageCategory)} tone="success" />
          </View>
          <Title>{match.field.nume}</Title>

          <Card>
            <InfoRow
              icon="📅"
              label="Când"
              value={`${formatDay(dayOf(match.startsAt))}\n${formatTime(match.startsAt)}–${formatTime(match.endsAt)}`}
            />
            <Divider />
            <InfoRow icon="📍" label="Unde" value={`${match.field.adresa}, ${sectorLabel(match.field.sector)}`} />
            <Divider />
            <InfoRow icon="🧑‍💼" label="Organizat de" value={match.creator.name ?? "jucător fără nume în profil"} />
          </Card>

          <Card>
            <View style={styles.placesHeader}>
              <Text style={styles.placesTitle}>Locuri</Text>
              <Text style={[styles.placesCount, match.isFull && { color: colors.error }]}>
                {match.participantCount} / {match.maxPlayers}
              </Text>
            </View>
            <ProgressBar value={match.participantCount} max={match.maxPlayers} tone={match.isFull ? "error" : "success"} />
            <Text style={styles.placesHint}>
              {match.isFull
                ? "Meciul este complet."
                : `Mai ${match.availablePlaces === 1 ? "este 1 loc liber" : `sunt ${match.availablePlaces} locuri libere`}.`}
            </Text>
          </Card>

          {session.isPlayer && (
            <View>
              <Notice message={result?.text ?? null} tone={result?.tone} />
              {result?.needsProfile && (
                <SecondaryButton label="Completează profilul" icon="👤" onPress={() => router.push("/profile")} />
              )}
            </View>
          )}

          <SectionTitle>Participanți ({participants.length})</SectionTitle>
          {participants.length === 0 ? (
            <EmptyState icon="👥" message="Încă nu s-a înscris nimeni. Fii primul!" />
          ) : (
            <Card>
              {participants.map((p, i) => {
                const me = p.user.id === session.user.id;
                return (
                  <View key={p.user.id}>
                    {i > 0 && <Divider />}
                    <View style={styles.participant}>
                      <Avatar name={p.user.name} size={36} highlighted={me} />
                      <Text style={styles.participantName} numberOfLines={1}>
                        {p.user.name ?? "Jucător fără nume"}
                      </Text>
                      {me && <Badge label="Tu" tone="success" />}
                    </View>
                  </View>
                );
              })}
            </Card>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { marginTop: 4, marginBottom: 6 },
  placesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  placesTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  placesCount: { fontSize: 20, fontWeight: "800", color: colors.primaryPressed },
  placesHint: { fontSize: 14, color: colors.textMuted, marginTop: 8 },
  participant: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  participantName: { flex: 1, fontSize: 16, color: colors.text, fontWeight: "500" },
  status: { minHeight: 54, justifyContent: "center", alignItems: "center", marginTop: 8 },
  statusText: { fontSize: 15, fontWeight: "700", color: colors.textMuted, textAlign: "center" },
  footerButton: { marginTop: 8 },
});
