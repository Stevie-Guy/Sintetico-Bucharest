import type { UserRole } from "../../generated/prisma/enums";

/**
 * Cine are drepturile unui rol, pe lângă rolul însuși:
 *  - CHAMPIONSHIP_ORGANIZER este o specializare a jucătorului, deci are și drepturile unui PLAYER;
 *  - ADMIN are drepturile tuturor rolurilor, ca să poată folosi aplicația din perspectiva oricăruia.
 *
 * Funcție pură, fără bază de date; o folosește middleware-ul `requireRole`.
 */
export function hasRole(userRole: UserRole, allowed: readonly UserRole[]): boolean {
  if (userRole === "ADMIN") return true;
  if (allowed.includes(userRole)) return true;
  return userRole === "CHAMPIONSHIP_ORGANIZER" && allowed.includes("PLAYER");
}
