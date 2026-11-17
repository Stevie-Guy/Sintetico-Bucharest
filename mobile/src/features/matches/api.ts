import { apiRequest } from "@/api/client";
import type { Page } from "@/features/fields/api";
import type { MatchAgeCategory, Sector } from "@/lib/labels";

// US-08: creare meci. US-09: lista meciurilor viitoare. US-10: înscriere.

export interface MatchField {
  id: string;
  nume: string;
  adresa: string;
  sector: Sector;
  numarJucatori: number;
}

export interface Match {
  id: string;
  /** ISO UTC. */
  startsAt: string;
  endsAt: string;
  maxPlayers: number;
  ageCategory: MatchAgeCategory;
  creator: { id: string; name: string | null };
  field: MatchField;
  participantCount: number;
  availablePlaces: number;
  isFull: boolean;
}

export interface Participant {
  joinedAt: string;
  user: { id: string; name: string | null };
}

export interface EligibleReservation {
  id: string;
  startsAtUtc: string;
  endsAtUtc: string;
  field: MatchField;
}

export interface CreateMatchInput {
  reservationId: string;
  startsAt: string;
  maxPlayers: number;
  ageCategory: MatchAgeCategory;
}

export function listMatches(token: string, page = 1) {
  return apiRequest<Page & { matches: Match[] }>(`/api/matches?page=${page}&pageSize=50`, { token });
}

export async function getMatch(token: string, id: string): Promise<Match> {
  const { match } = await apiRequest<{ match: Match }>(`/api/matches/${id}`, { token });
  return match;
}

/** Toți participanții (paginile API-ului, câte 100). */
export async function listParticipants(token: string, matchId: string): Promise<Participant[]> {
  const all: Participant[] = [];
  for (let page = 1; page <= 10; page++) {
    const result = await apiRequest<Page & { participants: Participant[] }>(
      `/api/matches/${matchId}/participants?page=${page}&pageSize=100`,
      { token },
    );
    all.push(...result.participants);
    if (!result.hasMore) break;
  }
  return all;
}

export async function joinMatch(token: string, matchId: string): Promise<Match> {
  const { match } = await apiRequest<{ match: Match }>(`/api/matches/${matchId}/participants`, {
    method: "POST",
    token,
    body: {},
  });
  return match;
}

export function listEligibleReservations(token: string) {
  return apiRequest<Page & { reservations: EligibleReservation[] }>(
    "/api/matches/eligible-reservations?pageSize=100",
    { token },
  );
}

export function createMatch(token: string, input: CreateMatchInput) {
  return apiRequest<{ match: Match; warnings: { code: string; message: string }[] }>("/api/matches", {
    method: "POST",
    token,
    body: input,
  });
}
