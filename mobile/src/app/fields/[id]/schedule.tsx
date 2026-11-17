import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { FormError, PrimaryButton } from "@/components/form";
import { DayPicker } from "@/components/day-picker";
import {
  Badge,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Hint,
  LinkButton,
  LoadingState,
  Notice,
  Screen,
  SectionTitle,
  TextField,
  uiStyles,
} from "@/components/ui";
import { useSession } from "@/features/auth/use-session";
import {
  addAvailability,
  deleteAvailability,
  getField,
  getOperatingHours,
  listAvailability,
  setOperatingHours,
} from "@/features/fields/api";
import { formatDay, isValidTime, nextDays } from "@/lib/datetime";
import { errorMessage, useResource } from "@/lib/use-resource";
import { colors } from "@/theme";

const DAYS = 30;

// US-06: programul zilnic al terenului și intervalele care se pot rezerva. Doar pentru proprietar.
export default function ScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession();
  const days = nextDays(DAYS);
  const [day, setDay] = useState(days[0]);

  const details = useResource(async () => {
    if (!session) return null;
    const [field, hours] = await Promise.all([getField(session.token, id), getOperatingHours(session.token, id)]);
    return { field, hours };
  }, [session?.token, id]);

  const intervals = useResource(
    () => (session ? listAvailability(session.token, id, day) : Promise.resolve([])),
    [session?.token, id, day],
  );

  // Programul de funcționare
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [hoursErrors, setHoursErrors] = useState<Record<string, string[]>>({});
  const [hoursMessage, setHoursMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [savingHours, setSavingHours] = useState(false);

  // Interval nou
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [intervalErrors, setIntervalErrors] = useState<Record<string, string[]>>({});
  const [intervalError, setIntervalError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const hours = details.data?.hours;
  useEffect(() => {
    if (hours) {
      setOpensAt(hours.opensAt);
      setClosesAt(hours.closesAt);
    }
  }, [hours?.opensAt, hours?.closesAt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return <Redirect href="/" />;
  const { token } = session;
  const field = details.data?.field;

  async function saveHours() {
    setHoursMessage(null);
    const errors: Record<string, string[]> = {};
    if (!isValidTime(opensAt)) errors.opensAt = ["Format HH:mm, ex. 08:00."];
    if (!isValidTime(closesAt, true)) errors.closesAt = ["Format HH:mm, ex. 23:00 (sau 24:00)."];
    if (!errors.opensAt && !errors.closesAt && opensAt >= closesAt) {
      errors.closesAt = ["Ora închiderii trebuie să fie după ora deschiderii."];
    }
    setHoursErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingHours(true);
    try {
      await setOperatingHours(token, id, { opensAt, closesAt });
      setHoursMessage({ text: "Programul a fost salvat.", tone: "success" });
      details.reload();
      intervals.reload();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setHoursErrors(err.fields);
      setHoursMessage({ text: errorMessage(err), tone: "error" });
    } finally {
      setSavingHours(false);
    }
  }

  async function addInterval() {
    setIntervalError(null);
    const errors: Record<string, string[]> = {};
    if (!isValidTime(startsAt)) errors.startsAt = ["Format HH:mm, ex. 18:00."];
    if (!isValidTime(endsAt, true)) errors.endsAt = ["Format HH:mm, ex. 19:30."];
    if (!errors.startsAt && !errors.endsAt && startsAt >= endsAt) {
      errors.endsAt = ["Sfârșitul trebuie să fie după început."];
    }
    setIntervalErrors(errors);
    if (Object.keys(errors).length) return;

    setAdding(true);
    try {
      await addAvailability(token, id, { date: day, startsAt, endsAt });
      setStartsAt("");
      setEndsAt("");
      intervals.reload();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setIntervalErrors(err.fields);
      setIntervalError(errorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function remove(intervalId: string) {
    setDeleting(intervalId);
    setListError(null);
    try {
      await deleteAvailability(token, id, intervalId);
      intervals.reload();
    } catch (err) {
      setListError(errorMessage(err));
    } finally {
      setDeleting(null);
    }
  }

  if (details.loading && !details.data) return <Screen><LoadingState /></Screen>;
  if (details.error && !details.data) {
    return (
      <Screen>
        <ErrorState message={details.error} onRetry={details.reload} />
      </Screen>
    );
  }
  if (field && field.adminId !== session.user.id) {
    return (
      <Screen>
        <Notice message="Doar administratorul acestui teren îi poate modifica programul." tone="error" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: field ? `Program · ${field.nume}` : "Program" }} />

      <View style={styles.stepRow}>
        <Text style={styles.stepTitle}>🕒 Program de funcționare</Text>
        {hours ? <Badge label={`${hours.opensAt}–${hours.closesAt}`} tone="success" /> : <Badge label="Nesetat" tone="warning" />}
      </View>
      <Card>
      <Hint>Același program în fiecare zi, ora României. Intervalele rezervabile trebuie să fie în acest program.</Hint>
      <View style={uiStyles.buttonsRow}>
        <View style={uiStyles.flex}>
          <TextField
            label="Deschidere"
            value={opensAt}
            onChangeText={setOpensAt}
            placeholder="08:00"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            errors={hoursErrors.opensAt}
          />
        </View>
        <View style={uiStyles.flex}>
          <TextField
            label="Închidere"
            value={closesAt}
            onChangeText={setClosesAt}
            placeholder="23:00"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            errors={hoursErrors.closesAt}
          />
        </View>
      </View>
      <Notice message={hoursMessage?.text ?? null} tone={hoursMessage?.tone} />
      <PrimaryButton label={hours ? "Actualizează programul" : "Salvează programul"} onPress={saveHours} loading={savingHours} style={styles.cardButton} />
      </Card>

      <View style={styles.stepRow}>
        <Text style={styles.stepTitle}>📅 Intervale rezervabile</Text>
      </View>
      {!hours ? (
        <Notice message="Salvează întâi programul de funcționare, apoi adaugă intervalele." tone="warning" />
      ) : (
        <View>
          <Hint>
            Doar intervalele adăugate aici pot fi rezervate; restul timpului e indisponibil. Intervalele deja
            rezervate sau în așteptare nu mai apar în listă și nu se pot șterge.
          </Hint>
          <DayPicker days={days} selected={day} onSelect={setDay} />

          {intervals.loading && !intervals.data ? (
            <LoadingState />
          ) : intervals.error ? (
            <ErrorState message={intervals.error} onRetry={intervals.reload} />
          ) : !intervals.data?.length ? (
            <EmptyState icon="📅" message={`Niciun interval liber ${formatDay(day)}. Adaugă unul mai jos.`} />
          ) : (
            <Card>
              <Text style={styles.listTitle}>Libere {formatDay(day)}</Text>
              {intervals.data.map((interval, i) => (
                <View key={interval.id}>
                  {i > 0 && <Divider />}
                  <View style={uiStyles.row}>
                    <Text style={styles.interval}>
                      {interval.startsAt}–{interval.endsAt}
                    </Text>
                    <LinkButton
                      label={deleting === interval.id ? "Se șterge…" : "🗑️ Șterge"}
                      onPress={() => remove(interval.id)}
                      danger
                    />
                  </View>
                </View>
              ))}
            </Card>
          )}
          <Notice message={listError} tone="error" />

          <SectionTitle>Adaugă interval</SectionTitle>
          <Card>
          <Text style={styles.listTitle}>Pentru {formatDay(day)}</Text>
          <View style={uiStyles.buttonsRow}>
            <View style={uiStyles.flex}>
              <TextField
                label="Început"
                value={startsAt}
                onChangeText={setStartsAt}
                placeholder="18:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                errors={intervalErrors.startsAt}
              />
            </View>
            <View style={uiStyles.flex}>
              <TextField
                label="Sfârșit"
                value={endsAt}
                onChangeText={setEndsAt}
                placeholder="19:30"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                errors={intervalErrors.endsAt}
              />
            </View>
          </View>
          <FormError message={intervalError} />
          <PrimaryButton label="Adaugă intervalul" icon="➕" onPress={addInterval} loading={adding} style={styles.cardButton} />
          </Card>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 10 },
  stepTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  cardButton: { marginTop: 18 },
  listTitle: { fontSize: 13, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginBottom: 4 },
  interval: { fontSize: 17, fontWeight: "700", color: colors.text },
});
