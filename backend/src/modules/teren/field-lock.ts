import type { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../errors/app-error";

/** Programul, disponibilitatea și rezervările folosesc aceeași blocare pe teren. */
export async function lockField(tx: Prisma.TransactionClient, fieldId: string) {
  const fields = await tx.$queryRaw<{ admin_id: string }[]>`
    SELECT admin_id FROM terenuri WHERE id = ${fieldId}::uuid FOR UPDATE`;
  if (!fields.length) throw new AppError(404, "FIELD_NOT_FOUND", "Terenul nu există.");
  return { adminId: fields[0].admin_id };
}

export async function lockOwnedField(tx: Prisma.TransactionClient, fieldId: string, userId: string) {
  const field = await lockField(tx, fieldId);
  if (field.adminId !== userId) throw new AppError(403, "FIELD_NOT_OWNED", "Doar administratorul acestui teren poate face această modificare.");
  return field;
}
