import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import type { UpdateProfileInput } from "./profile.schemas";

export const playerProfileFields = {
  id: true,
  email: true,
  role: true,
  name: true,
  dateOfBirth: true,
  preferredPosition: true,
  dominantFoot: true,
  phoneNumber: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PlayerProfile = Prisma.UserGetPayload<{ select: typeof playerProfileFields }>;

export async function getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: playerProfileFields,
  });
}

export async function updatePlayerProfile(userId: string, input: UpdateProfileInput): Promise<PlayerProfile> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      dateOfBirth:
        input.dateOfBirth === undefined
          ? undefined
          : input.dateOfBirth === null
            ? null
            : new Date(`${input.dateOfBirth}T00:00:00.000Z`),
      preferredPosition: input.preferredPosition,
      dominantFoot: input.dominantFoot,
      phoneNumber: input.phoneNumber,
    },
    select: playerProfileFields,
  });
}
