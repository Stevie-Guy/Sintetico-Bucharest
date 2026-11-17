import { Redirect, router, Stack } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { formStyles, SecondaryButton } from "@/components/form";
import { Badge, ChipRow, EmptyState, ErrorState, ListItem, LoadingState, Screen } from "@/components/ui";
import { useSession } from "@/features/auth/use-session";
import { listFields, type Field } from "@/features/fields/api";
import { errorMessage, useResource } from "@/lib/use-resource";
import { sectorLabel, sectors, type Sector } from "@/lib/labels";

// US-05/US-07: lista terenurilor din aplicație, cu filtru după sector.
export default function FieldsScreen() {
  const session = useSession();
  const [sector, setSector] = useState<Sector | null>(null);
  const [extra, setExtra] = useState<{ fields: Field[]; page: number; hasMore: boolean } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  const first = useResource(async () => {
    setExtra(null);
    return session ? listFields(session.token, { sector: sector ?? undefined }) : null;
  }, [session?.token, sector]);

  if (!session) return <Redirect href="/" />;

  const fields = [...(first.data?.fields ?? []), ...(extra?.fields ?? [])];
  const hasMore = extra ? extra.hasMore : (first.data?.hasMore ?? false);

  async function loadMore() {
    if (!session) return;
    const nextPage = (extra?.page ?? 1) + 1;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const result = await listFields(session.token, { page: nextPage, sector: sector ?? undefined });
      setExtra({ fields: [...(extra?.fields ?? []), ...result.fields], page: nextPage, hasMore: result.hasMore });
    } catch (err) {
      setMoreError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <Screen onRefresh={first.reload} refreshing={false}>
      <Stack.Screen options={{ title: "Terenuri" }} />
      <Text style={[formStyles.label, { marginTop: 0 }]}>Sector</Text>
      <ChipRow options={sectors} selected={sector} onSelect={setSector} allLabel="Toate" scroll />

      {first.loading && !first.data ? (
        <LoadingState />
      ) : first.error ? (
        <ErrorState message={first.error} onRetry={first.reload} />
      ) : fields.length === 0 ? (
        <EmptyState
          icon="🏟️"
          message={sector ? `Nu există terenuri în ${sectorLabel(sector)}.` : "Nu există încă terenuri în aplicație."}
        />
      ) : (
        fields.map((f) => (
          <ListItem
            key={f.id}
            icon="🏟️"
            title={f.nume}
            subtitle={`📍 ${f.adresa}
👥 ${f.numarJucatori} jucători recomandați`}
            right={<Badge label={sectorLabel(f.sector)} />}
            onPress={() => router.push({ pathname: "/fields/[id]", params: { id: f.id } })}
          />
        ))
      )}

      {moreError ? <ErrorState message={moreError} onRetry={loadMore} /> : null}
      {hasMore && !first.error ? (
        <SecondaryButton label="Încarcă mai multe" onPress={loadMore} loading={loadingMore} />
      ) : null}
    </Screen>
  );
}
