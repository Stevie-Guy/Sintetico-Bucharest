import { z } from "zod";
import { paginationShape } from "../reservations/reservation.schemas";

/**
 * Datele unui teren (US-05). Numărul de jucători este doar o recomandare pentru meciuri,
 * nu o limită strictă; aici se validează doar că e un număr plauzibil (1 vs 1 … 11 vs 11).
 */
const sector = z.enum(["SECTOR_1", "SECTOR_2", "SECTOR_3", "SECTOR_4", "SECTOR_5", "SECTOR_6"], {
  error: "Sectorul trebuie să fie între SECTOR_1 și SECTOR_6.",
});

export const fieldSchema = z.strictObject({
  nume: z.string().trim()
    .min(2, "Numele trebuie să aibă cel puțin 2 caractere.")
    .max(100, "Numele poate avea cel mult 100 de caractere."),
  adresa: z.string().trim()
    .min(5, "Adresa trebuie să aibă cel puțin 5 caractere.")
    .max(255, "Adresa poate avea cel mult 255 de caractere."),
  sector,
  numarJucatori: z.number({ error: "Numărul de jucători trebuie să fie un număr." })
    .int("Numărul de jucători trebuie să fie un număr întreg.")
    .min(2, "Numărul recomandat de jucători trebuie să fie cel puțin 2.")
    .max(22, "Numărul recomandat de jucători poate fi cel mult 22."),
});

export const fieldListQuerySchema = z.strictObject({ ...paginationShape, sector: sector.optional() });

export type FieldInput = z.infer<typeof fieldSchema>;
export type FieldListQuery = z.infer<typeof fieldListQuerySchema>;
