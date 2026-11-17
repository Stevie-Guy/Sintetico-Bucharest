import { Redirect, router, Stack } from "expo-router";
import { PrimaryButton } from "@/components/form";
import { Badge, EmptyState, ErrorState, ListItem, LoadingState, Screen } from "@/components/ui";
import { useProfileGate } from "@/features/profile/profile-gate";
import { useSession } from "@/features/auth/use-session";
import { listOwnFields } from "@/features/fields/api";
import { sectorLabel } from "@/lib/labels";
import { useResource } from "@/lib/use-resource";

// US-05: terenurile administratorului autentificat.
export default function MyFieldsScreen() {
  const session = useSession();
  const { requireProfile } = useProfileGate();
  const fields = useResource(
    () => (session ? listOwnFields(session.token, session.user.id) : Promise.resolve([])),
    [session?.token, session?.user.id],
  );

  if (!session) return <Redirect href="/" />;

  return (
    <Screen
      onRefresh={fields.reload}
      refreshing={false}
      footer={<PrimaryButton label="Adaugă teren" icon="➕" onPress={() => requireProfile("adăuga un teren", () => router.push("/fields/new"))} style={{ marginTop: 8 }} />}
    >
      <Stack.Screen options={{ title: "Terenurile mele" }} />
      {fields.loading && !fields.data ? (
        <LoadingState />
      ) : fields.error ? (
        <ErrorState message={fields.error} onRetry={fields.reload} />
      ) : !fields.data?.length ? (
        <EmptyState
          icon="🏟️"
          title="Niciun teren încă"
          message="Adaugă primul teren ca jucătorii să-l poată găsi și rezerva."
        />
      ) : (
        fields.data.map((f) => (
          <ListItem
            key={f.id}
            icon="🏟️"
            title={f.nume}
            subtitle={`📍 ${f.adresa}`}
            right={<Badge label={sectorLabel(f.sector)} />}
            onPress={() => router.push({ pathname: "/fields/[id]", params: { id: f.id } })}
          />
        ))
      )}
    </Screen>
  );
}
