/**
 * Profilul e complet când are nume și număr de telefon. Fără ele utilizatorul poate doar să vadă
 * aplicația; orice acțiune (rezervare, meci, teren, program, aprobare) cere profilul complet.
 *
 * Valoarea nu ține cont de rol: Administratorul e scutit abia în `requireCompleteProfile`. Așa aplicația
 * îi poate aplica regula când folosește perspectiva altui rol, ca să vadă exact ce vede acel rol.
 *
 * Funcție pură, fără bază de date; o folosesc autentificarea și middleware-ul `requireCompleteProfile`.
 */
export function isProfileComplete(profile: { name: string | null; phoneNumber: string | null }): boolean {
  return Boolean(profile.name?.trim()) && Boolean(profile.phoneNumber?.trim());
}
