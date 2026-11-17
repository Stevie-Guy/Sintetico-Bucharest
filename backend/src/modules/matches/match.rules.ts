import type { MatchAgeCategory } from "../../generated/prisma/enums";
import { AppError } from "../../errors/app-error";
import { AgeCategory, calculateAgeCategory } from "../profile/age-category";

const categories: Record<AgeCategory, MatchAgeCategory> = {
  [AgeCategory.U12]: "U12", [AgeCategory.U15]: "U15", [AgeCategory.U18]: "U18",
  [AgeCategory.Seniori]: "SENIOR", [AgeCategory.Veterani35Plus]: "VETERANS_35_PLUS",
};

export function validateMatchTime(startsAt: Date, reservation: { startsAtUtc: Date; endsAtUtc: Date }, now = new Date()) {
  if (startsAt <= now) throw new AppError(400, "MATCH_IN_PAST", "Meciul trebuie să înceapă în viitor.");
  if (startsAt < reservation.startsAtUtc || startsAt >= reservation.endsAtUtc) {
    throw new AppError(400, "OUTSIDE_RESERVATION", "Ora meciului trebuie să fie în intervalul rezervat.");
  }
}

export function requireMatchingAge(dateOfBirth: Date | null, category: MatchAgeCategory, now = new Date()) {
  if (!dateOfBirth) throw new AppError(400, "DATE_OF_BIRTH_REQUIRED", "Completează data nașterii în profil înainte de înscriere.");
  if (categories[calculateAgeCategory(dateOfBirth, now)] !== category) {
    throw new AppError(403, "AGE_CATEGORY_MISMATCH", "Categoria ta de vârstă nu corespunde meciului.");
  }
}
