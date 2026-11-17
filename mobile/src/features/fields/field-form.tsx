import { useState } from "react";
import { Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { FieldError, FormError, formStyles, PrimaryButton } from "@/components/form";
import { ChipRow, Hint, TextField } from "@/components/ui";
import { useProfileGate } from "@/features/profile/profile-gate";
import { sectors, type Sector } from "@/lib/labels";
import { errorMessage } from "@/lib/use-resource";
import type { FieldInput } from "./api";

/**
 * Formularul de teren (US-05), comun pentru adăugare și editare.
 * Regulile sunt cele din backend: nume 2–100, adresă 5–255, sector 1–6, 2–22 jucători (doar recomandare).
 */
export function FieldForm({
  initial,
  submitLabel,
  feature,
  onSubmit,
}: {
  initial?: FieldInput;
  submitLabel: string;
  /** Pentru overlay-ul de profil incomplet: „Completează-ți profilul pentru a …”. */
  feature: string;
  onSubmit: (input: FieldInput) => Promise<void>;
}) {
  const [nume, setNume] = useState(initial?.nume ?? "");
  const [adresa, setAdresa] = useState(initial?.adresa ?? "");
  const [sector, setSector] = useState<Sector | null>(initial?.sector ?? null);
  const [players, setPlayers] = useState(initial ? String(initial.numarJucatori) : "");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { requireProfile } = useProfileGate();

  async function handleSubmit() {
    setFormError(null);
    const next: Record<string, string[]> = {};
    if (nume.trim().length < 2) next.nume = ["Numele trebuie să aibă cel puțin 2 caractere."];
    if (adresa.trim().length < 5) next.adresa = ["Adresa trebuie să aibă cel puțin 5 caractere."];
    if (!sector) next.sector = ["Alege sectorul."];
    const count = Number(players);
    if (!Number.isInteger(count) || count < 2 || count > 22) {
      next.numarJucatori = ["Scrie un număr întreg între 2 și 22."];
    }
    setErrors(next);
    if (Object.keys(next).length || !sector) return;

    setSaving(true);
    try {
      await onSubmit({ nume: nume.trim(), adresa: adresa.trim(), sector, numarJucatori: count });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields);
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <TextField label="Nume" value={nume} onChangeText={setNume} placeholder="ex. Baza Sportivă Titan" maxLength={100} errors={errors.nume} />
      <TextField
        label="Adresă"
        value={adresa}
        onChangeText={setAdresa}
        placeholder="Strada, număr"
        maxLength={255}
        errors={errors.adresa}
      />

      <Text style={formStyles.label}>Sector</Text>
      <ChipRow options={sectors} selected={sector} onSelect={setSector} />
      <FieldError messages={errors.sector} />

      <TextField
        label="Număr recomandat de jucători"
        value={players}
        onChangeText={(v) => setPlayers(v.replace(/\D/g, ""))}
        placeholder="ex. 10"
        keyboardType="number-pad"
        maxLength={2}
        errors={errors.numarJucatori}
      />
      <Hint>Doar o recomandare pentru meciuri, nu o limită. Între 2 și 22.</Hint>

      <FormError message={formError} />
      <PrimaryButton label={submitLabel} icon="💾" onPress={() => requireProfile(feature, handleSubmit)} loading={saving} />
    </View>
  );
}
