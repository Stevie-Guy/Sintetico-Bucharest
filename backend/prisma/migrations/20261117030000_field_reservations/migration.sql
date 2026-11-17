-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RESERVATION_REQUESTED', 'RESERVATION_APPROVED', 'RESERVATION_REJECTED');

-- AlterTable
ALTER TABLE "field_availability" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "availability_id" UUID,
    "date" DATE NOT NULL,
    "starts_at" INTEGER NOT NULL,
    "ends_at" INTEGER NOT NULL,
    "starts_at_utc" TIMESTAMPTZ(3) NOT NULL,
    "ends_at_utc" TIMESTAMPTZ(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reservations_field_id_status_date_idx" ON "reservations"("field_id", "status", "date");

-- CreateIndex
CREATE INDEX "reservations_player_id_created_at_id_idx" ON "reservations"("player_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "reservations_availability_id_idx" ON "reservations"("availability_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_read_at_created_at_idx" ON "notifications"("recipient_id", "read_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_reservation_id_recipient_id_type_key" ON "notifications"("reservation_id", "recipient_id", "type");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "terenuri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_availability_id_fkey" FOREIGN KEY ("availability_id") REFERENCES "field_availability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Index unic parțial: cererile respinse păstrează istoricul, dar eliberează intervalul.
-- Nu este exprimabil în modelul Prisma; păstrați-l în migrațiile SQL.
CREATE UNIQUE INDEX "reservations_one_active_per_interval"
  ON "reservations" ("availability_id") WHERE "status" IN ('PENDING', 'APPROVED');

ALTER TABLE "field_availability" ADD CONSTRAINT "field_availability_positive_version" CHECK ("version" > 0);
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_valid_interval"
  CHECK ("starts_at" >= 0 AND "ends_at" <= 1440 AND "starts_at" < "ends_at" AND "starts_at_utc" < "ends_at_utc");
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_valid_decision"
  CHECK (("status" = 'PENDING' AND "decided_at" IS NULL) OR ("status" <> 'PENDING' AND "decided_at" IS NOT NULL));
