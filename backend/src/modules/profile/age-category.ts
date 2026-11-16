export enum AgeCategory {
  U12 = "U12",
  U15 = "U15",
  U18 = "U18",
  Seniori = "Seniori",
  Veterani35Plus = "Veterani 35+",
}

export function calculateAgeCategory(dateOfBirth: Date, currentDate = new Date()): AgeCategory {
  const birthTime = dateOfBirth.getTime();
  const currentTime = currentDate.getTime();
  if (!Number.isFinite(birthTime) || !Number.isFinite(currentTime)) {
    throw new RangeError("Data nașterii și data curentă trebuie să fie valide.");
  }

  const birthYear = dateOfBirth.getUTCFullYear();
  const currentYear = currentDate.getUTCFullYear();
  const birthdayThisYear = Date.UTC(currentYear, dateOfBirth.getUTCMonth(), dateOfBirth.getUTCDate());
  const today = Date.UTC(currentYear, currentDate.getUTCMonth(), currentDate.getUTCDate());
  const age = currentYear - birthYear - (today < birthdayThisYear ? 1 : 0);

  if (age < 0) {
    throw new RangeError("Data nașterii nu poate fi în viitor.");
  }
  if (age < 12) return AgeCategory.U12;
  if (age < 15) return AgeCategory.U15;
  if (age < 18) return AgeCategory.U18;
  if (age < 35) return AgeCategory.Seniori;
  return AgeCategory.Veterani35Plus;
}
