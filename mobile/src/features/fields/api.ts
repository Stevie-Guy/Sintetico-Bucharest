import { apiRequest } from "@/api/client";
import type { Sector } from "@/lib/labels";

// US-05: terenuri. US-06: programul și intervalele disponibile.

export interface Field {
  id: string;
  nume: string;
  adresa: string;
  sector: Sector;
  numarJucatori: number;
  adminId: string;
}

export interface FieldInput {
  nume: string;
  adresa: string;
  sector: Sector;
  numarJucatori: number;
}

export interface Page {
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface OperatingHours {
  fieldId: string;
  opensAt: string;
  closesAt: string;
}

export interface AvailabilityInterval {
  id: string;
  version: number;
  fieldId: string;
  date: string;
  startsAt: string;
  endsAt: string;
}

export interface AvailabilityInput {
  date: string;
  startsAt: string;
  endsAt: string;
}

export function listFields(token: string, params: { page?: number; pageSize?: number; sector?: Sector } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.sector) query.set("sector", params.sector);
  return apiRequest<Page & { fields: Field[] }>(`/api/terenuri?${query}`, { token });
}

/**
 * Terenurile administratorului autentificat. API-ul nu are încă un filtru după proprietar,
 * așa că parcurgem lista (100 pe pagină) și păstrăm doar terenurile proprii.
 */
export async function listOwnFields(token: string, adminId: string): Promise<Field[]> {
  const own: Field[] = [];
  for (let page = 1; page <= 20; page++) {
    const result = await listFields(token, { page, pageSize: 100 });
    own.push(...result.fields.filter((f) => f.adminId === adminId));
    if (!result.hasMore) break;
  }
  return own;
}

export async function getField(token: string, id: string): Promise<Field> {
  const { field } = await apiRequest<{ field: Field }>(`/api/terenuri/${id}`, { token });
  return field;
}

export async function createField(token: string, input: FieldInput): Promise<Field> {
  const { field } = await apiRequest<{ field: Field }>("/api/terenuri", { method: "POST", token, body: input });
  return field;
}

export async function updateField(token: string, id: string, input: FieldInput): Promise<Field> {
  const { field } = await apiRequest<{ field: Field }>(`/api/terenuri/${id}`, { method: "PUT", token, body: input });
  return field;
}

export async function getOperatingHours(token: string, fieldId: string): Promise<OperatingHours | null> {
  const { operatingHours } = await apiRequest<{ operatingHours: OperatingHours | null }>(
    `/api/terenuri/${fieldId}/operating-hours`,
    { token },
  );
  return operatingHours;
}

export async function setOperatingHours(token: string, fieldId: string, input: { opensAt: string; closesAt: string }) {
  const { operatingHours } = await apiRequest<{ operatingHours: OperatingHours }>(
    `/api/terenuri/${fieldId}/operating-hours`,
    { method: "PUT", token, body: input },
  );
  return operatingHours;
}

/** Intervalele libere (nerezervate, încă neîncepute) dintr-o zi. */
export async function listAvailability(token: string, fieldId: string, date: string) {
  const { intervals } = await apiRequest<{ intervals: AvailabilityInterval[] }>(
    `/api/terenuri/${fieldId}/availability?date=${date}`,
    { token },
  );
  return intervals;
}

export async function addAvailability(token: string, fieldId: string, input: AvailabilityInput) {
  const { interval } = await apiRequest<{ interval: AvailabilityInterval }>(`/api/terenuri/${fieldId}/availability`, {
    method: "POST",
    token,
    body: input,
  });
  return interval;
}

export function deleteAvailability(token: string, fieldId: string, intervalId: string) {
  return apiRequest<void>(`/api/terenuri/${fieldId}/availability/${intervalId}`, { method: "DELETE", token });
}
