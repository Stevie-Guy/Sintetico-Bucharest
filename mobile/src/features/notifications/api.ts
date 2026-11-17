import { apiRequest } from "@/api/client";
import type { Page } from "@/features/fields/api";
import type { ReservationStatus } from "@/lib/labels";

// Notificările din aplicație despre rezervări (cerere nouă, aprobată, respinsă).

export interface Notification {
  id: string;
  type: "RESERVATION_REQUESTED" | "RESERVATION_APPROVED" | "RESERVATION_REJECTED";
  message: string;
  reservationId: string | null;
  readAt: string | null;
  createdAt: string;
  reservation: { fieldId: string; status: ReservationStatus } | null;
}

export function listNotifications(token: string, page = 1) {
  return apiRequest<Page & { notifications: Notification[]; unreadCount: number }>(
    `/api/notifications?page=${page}&pageSize=30`,
    { token },
  );
}

export function markRead(token: string, id: string) {
  return apiRequest<void>(`/api/notifications/${id}/read`, { method: "PATCH", token });
}
