import { Redirect, router, Stack, useLocalSearchParams } from "expo-router";
import { ErrorState, LoadingState, Notice, Screen, Title } from "@/components/ui";
import { useSession } from "@/features/auth/use-session";
import { getField, updateField } from "@/features/fields/api";
import { FieldForm } from "@/features/fields/field-form";
import { useResource } from "@/lib/use-resource";

// US-05: editare teren. Doar proprietarul îl poate edita (verificat și de server).
export default function EditFieldScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession();
  const field = useResource(
    () => (session ? getField(session.token, id) : Promise.resolve(null)),
    [session?.token, id],
  );

  if (!session) return <Redirect href="/" />;
  const { token } = session;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Editează terenul" }} />
      <Title subtitle="Modificările se văd imediat în aplicație.">Editează terenul</Title>
      {field.loading && !field.data ? (
        <LoadingState />
      ) : field.error && !field.data ? (
        <ErrorState message={field.error} onRetry={field.reload} />
      ) : field.data && field.data.adminId !== session.user.id ? (
        <Notice message="Doar administratorul acestui teren îl poate edita." tone="error" />
      ) : field.data ? (
        <FieldForm
          key={field.data.id}
          initial={field.data}
          submitLabel="Salvează modificările"
          onSubmit={async (input) => {
            await updateField(token, id, input);
            router.back();
          }}
        />
      ) : null}
    </Screen>
  );
}
