import { apiRequest } from "@/api/client";
import type { DominantFoot, PlayerPosition } from "@/lib/labels";

// US-03, US-04: profilul jucătorului. Categoria de vârstă o calculează serverul din data nașterii.

export interface PlayerProfile {
  id: string;
  email: string;
  name: string | null;
  /** ISO; ziua e în primele 10 caractere. */
  dateOfBirth: string | null;
  preferredPosition: PlayerPosition | null;
  dominantFoot: DominantFoot | null;
  phoneNumber: string | null;
  /** „U12”, „U15”, „U18”, „Seniori”, „Veterani 35+” sau null fără dată de naștere. */
  ageCategory: string | null;
}

export interface ProfileUpdate {
  name?: string | null;
  dateOfBirth?: string | null;
  preferredPosition?: PlayerPosition | null;
  dominantFoot?: DominantFoot | null;
  phoneNumber?: string | null;
}

export async function getProfile(token: string): Promise<PlayerProfile> {
  const { user } = await apiRequest<{ user: PlayerProfile }>("/api/profile", { token });
  return user;
}

export async function updateProfile(token: string, input: ProfileUpdate): Promise<PlayerProfile> {
  const { user } = await apiRequest<{ user: PlayerProfile }>("/api/profile", { method: "PATCH", token, body: input });
  return user;
}
