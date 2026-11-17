import { Redirect, router, Stack } from "expo-router";
import { Screen, Title } from "@/components/ui";
import { useSession } from "@/features/auth/use-session";
import { createField } from "@/features/fields/api";
import { FieldForm } from "@/features/fields/field-form";

// US-05: adăugare teren. Cine îl adaugă devine proprietarul lui.
export default function NewFieldScreen() {
  const session = useSession();
  if (!session) return <Redirect href="/" />;
  const { token } = session;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Adaugă teren" }} />
      <Title subtitle="După salvare, setează programul și intervalele în care terenul se poate rezerva.">Teren nou 🏟️</Title>
      <FieldForm
        submitLabel="Salvează terenul"
        feature="adăuga un teren"
        onSubmit={async (input) => {
          const field = await createField(token, input);
          router.replace({ pathname: "/fields/[id]", params: { id: field.id } });
        }}
      />
    </Screen>
  );
}
