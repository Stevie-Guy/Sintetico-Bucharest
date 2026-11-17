import { Badge } from "@/components/ui";
import { reservationStatusLabel, type ReservationStatus } from "@/lib/labels";

const tones = { PENDING: "warning", APPROVED: "success", REJECTED: "error" } as const;

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  return <Badge label={reservationStatusLabel(status)} tone={tones[status]} />;
}
