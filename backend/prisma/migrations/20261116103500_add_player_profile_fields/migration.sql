-- CreateEnum
CREATE TYPE "PlayerPosition" AS ENUM ('PORTAR', 'FUNDAS', 'MIJLOCAS', 'ATACANT');

-- CreateEnum
CREATE TYPE "DominantFoot" AS ENUM ('STANGA', 'DREAPTA');

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "name" VARCHAR(128),
ADD COLUMN "date_of_birth" DATE,
ADD COLUMN "preferred_position" "PlayerPosition",
ADD COLUMN "dominant_foot" "DominantFoot",
ADD COLUMN "phone_number" VARCHAR(12);
