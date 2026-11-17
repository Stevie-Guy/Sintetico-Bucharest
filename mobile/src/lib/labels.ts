/** Textele afișate pentru valorile enum din API (sector, categorie, poziție etc.). */

export type Sector = "SECTOR_1" | "SECTOR_2" | "SECTOR_3" | "SECTOR_4" | "SECTOR_5" | "SECTOR_6";
export const sectors: { value: Sector; label: string }[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  value: `SECTOR_${n}` as Sector,
  label: `Sector ${n}`,
}));
export const sectorLabel = (s: Sector) => sectors.find((x) => x.value === s)?.label ?? s;

export type MatchAgeCategory = "U12" | "U15" | "U18" | "SENIOR" | "VETERANS_35_PLUS";
export const matchCategories: { value: MatchAgeCategory; label: string }[] = [
  { value: "U12", label: "U12" },
  { value: "U15", label: "U15" },
  { value: "U18", label: "U18" },
  { value: "SENIOR", label: "Seniori" },
  { value: "VETERANS_35_PLUS", label: "Veterani 35+" },
];
export const matchCategoryLabel = (c: MatchAgeCategory) => matchCategories.find((x) => x.value === c)?.label ?? c;

/** Categoria din profil (texte din API: „U12”, „Seniori”, „Veterani 35+”) → categoria de meci. */
export const profileCategoryToMatch: Record<string, MatchAgeCategory> = {
  U12: "U12",
  U15: "U15",
  U18: "U18",
  Seniori: "SENIOR",
  "Veterani 35+": "VETERANS_35_PLUS",
};

export type PlayerPosition = "PORTAR" | "FUNDAS" | "MIJLOCAS" | "ATACANT";
export const positions: { value: PlayerPosition; label: string }[] = [
  { value: "PORTAR", label: "Portar" },
  { value: "FUNDAS", label: "Fundaș" },
  { value: "MIJLOCAS", label: "Mijlocaș" },
  { value: "ATACANT", label: "Atacant" },
];

export type DominantFoot = "STANGA" | "DREAPTA";
export const feet: { value: DominantFoot; label: string }[] = [
  { value: "STANGA", label: "Stâng" },
  { value: "DREAPTA", label: "Drept" },
];

export type ReservationStatus = "PENDING" | "APPROVED" | "REJECTED";
export const reservationStatuses: { value: ReservationStatus; label: string }[] = [
  { value: "PENDING", label: "În așteptare" },
  { value: "APPROVED", label: "Aprobată" },
  { value: "REJECTED", label: "Respinsă" },
];
export const reservationStatusLabel = (s: ReservationStatus) =>
  reservationStatuses.find((x) => x.value === s)?.label ?? s;
