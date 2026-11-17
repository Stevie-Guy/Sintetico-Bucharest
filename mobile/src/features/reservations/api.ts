import { apiRequest } from "@/api/client";
import type { Page } from "@/features/fields/api";
import type { ReservationStatus } from "@/lib/labels";

// US-07: rezervarea unui interval. Rămâne PENDING până o aprobă sau o respinge administratorul terenului.

export interface Reservation {
  id: string;
  fieldId: string;
  playerId: string;
  status: ReservationStatus;
  date: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  field?: { id: string; nume: string; adresa: string };
  player?: { id: string; name: string | null };
}

export async function createReservation(
  token: string,
  fieldId: string,
  input: { availabilityId: string; expectedVersion: number },
): Promise<Reservation> {
  const { reservation } = await apiRequest<{ reservation: Reservation }>(`/api/terenuri/${fieldId}/reservations`, {
    method: "POST",
    token,
    body: input,
  });
  return reservation;
}

function query(params: { page?: number; status?: ReservationStatus }) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.status) q.set("status", params.status);
  return q.toString();
}

export function listMyReservations(token: string, params: { page?: number; status?: ReservationStatus } = {}) {
  return apiRequest<Page & { reservations: Reservation[] }>(`/api/reservations?${query(params)}`, { token });
}

export function listFieldReservations(
  token: string,
  fieldId: string,
  params: { page?: number; status?: ReservationStatus } = {},
) {
  return apiRequest<Page & { reservations: Reservation[] }>(
    `/api/terenuri/${fieldId}/reservations?${query(params)}`,
    { token },
  );
}

export async function decideReservation(
  token: string,
  fieldId: string,
  reservationId: string,
  status: "APPROVED" | "REJECTED",
): Promise<Reservation> {
  const { reservation } = await apiRequest<{ reservation: Reservation }>(
    `/api/terenuri/${fieldId}/reservations/${reservationId}`,
    { method: "PATCH", token, body: { status } },
  );
  return reservation;
}
