import type { Teren } from "../../generated/prisma/client";
import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import { lockOwnedField } from "./field-lock";
import type { FieldInput, FieldListQuery } from "./teren.schemas";

function presentField(field: Teren) {
  return {
    id: field.id, nume: field.nume, adresa: field.adresa, sector: field.sector, numarJucatori: field.numarJucatori,
    adminId: field.adminId, createdAt: field.createdAt, updatedAt: field.updatedAt,
  };
}

/** Cine creează terenul devine proprietarul lui; doar el îl poate edita. */
export async function createField(adminId: string, input: FieldInput) {
  return presentField(await prisma.teren.create({ data: { ...input, adminId } }));
}

/**
 * Înlocuiește datele terenului. Folosește aceeași blocare ca programul și rezervările,
 * ca editarea să nu se intercaleze cu o operație în curs pe același teren.
 */
export async function updateField(fieldId: string, userId: string, input: FieldInput) {
  return prisma.$transaction(async (tx) => {
    await lockOwnedField(tx, fieldId, userId);
    return presentField(await tx.teren.update({ where: { id: fieldId }, data: input }));
  });
}

export async function getField(fieldId: string) {
  const field = await prisma.teren.findUnique({ where: { id: fieldId } });
  if (!field) throw new AppError(404, "FIELD_NOT_FOUND", "Terenul nu există.");
  return presentField(field);
}

export async function listFields({ page, pageSize, sector }: FieldListQuery) {
  const records = await prisma.teren.findMany({
    where: sector ? { sector } : {},
    orderBy: [{ nume: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize + 1,
  });
  return { fields: records.slice(0, pageSize).map(presentField), page, pageSize, hasMore: records.length > pageSize };
}
