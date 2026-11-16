-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('SECTOR_1', 'SECTOR_2', 'SECTOR_3', 'SECTOR_4', 'SECTOR_5', 'SECTOR_6');

-- CreateTable
CREATE TABLE "terenuri" (
    "id" UUID NOT NULL,
    "nume" VARCHAR(255) NOT NULL,
    "adresa" TEXT NOT NULL,
    "sector" "Sector" NOT NULL,
    "numar_jucatori" INTEGER NOT NULL,
    "admin_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terenuri_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "terenuri_admin_id_idx" ON "terenuri"("admin_id");

-- AddForeignKey
ALTER TABLE "terenuri" ADD CONSTRAINT "terenuri_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
