-- CreateEnum
CREATE TYPE "MatchAgeCategory" AS ENUM ('U12', 'U15', 'U18', 'SENIOR', 'VETERANS_35_PLUS');

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "max_players" INTEGER NOT NULL,
    "age_category" "MatchAgeCategory" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_participants" (
    "match_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_participants_pkey" PRIMARY KEY ("match_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "matches_reservation_id_key" ON "matches"("reservation_id");

-- CreateIndex
CREATE INDEX "matches_starts_at_id_idx" ON "matches"("starts_at", "id");

-- CreateIndex
CREATE INDEX "matches_creator_id_idx" ON "matches"("creator_id");

-- CreateIndex
CREATE INDEX "match_participants_user_id_idx" ON "match_participants"("user_id");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invariante simple protejate și la scrieri directe în baza de date.
ALTER TABLE "matches" ADD CONSTRAINT "matches_positive_capacity" CHECK ("max_players" > 0);
ALTER TABLE "matches" ADD CONSTRAINT "matches_valid_time_range" CHECK ("starts_at" < "ends_at");
