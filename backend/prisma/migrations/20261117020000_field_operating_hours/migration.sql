-- CreateTable
CREATE TABLE "field_operating_hours" (
    "field_id" UUID NOT NULL,
    "opens_at" INTEGER NOT NULL,
    "closes_at" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_operating_hours_pkey" PRIMARY KEY ("field_id")
);

-- CreateTable
CREATE TABLE "field_availability" (
    "id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "starts_at" INTEGER NOT NULL,
    "ends_at" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "field_availability_field_id_date_starts_at_idx" ON "field_availability"("field_id", "date", "starts_at");

-- AddForeignKey
ALTER TABLE "field_operating_hours" ADD CONSTRAINT "field_operating_hours_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "terenuri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_availability" ADD CONSTRAINT "field_availability_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "terenuri"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Invariante pentru ore locale, inclusiv când datele sunt scrise direct în SQL.
ALTER TABLE "field_operating_hours" ADD CONSTRAINT "field_operating_hours_valid_range"
  CHECK ("opens_at" >= 0 AND "closes_at" <= 1440 AND "opens_at" < "closes_at");
ALTER TABLE "field_availability" ADD CONSTRAINT "field_availability_valid_range"
  CHECK ("starts_at" >= 0 AND "ends_at" <= 1440 AND "starts_at" < "ends_at");
