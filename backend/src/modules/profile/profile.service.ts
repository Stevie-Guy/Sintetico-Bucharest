import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { calculateAgeCategory, type AgeCategory } from "./age-category";
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

type PlayerProfileRecord = Prisma.UserGetPayload<{ select: typeof playerProfileFields }>;

export type PlayerProfile = PlayerProfileRecord & { ageCategory: AgeCategory | null };

function withAgeCategory(profile: PlayerProfileRecord): PlayerProfile {
  return {
    ...profile,
    ageCategory: profile.dateOfBirth ? calculateAgeCategory(profile.dateOfBirth) : null,
  };
}

export async function getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: playerProfileFields,
  });
  return profile ? withAgeCategory(profile) : null;
}

export async function updatePlayerProfile(userId: string, input: UpdateProfileInput): Promise<PlayerProfile> {
  const profile = await prisma.user.update({
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
  return withAgeCategory(profile);
}
