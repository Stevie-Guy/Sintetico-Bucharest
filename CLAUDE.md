# CLAUDE.md

Ghid pentru Claude Code când lucrează în acest repository.

## Despre proiect

**Sintetico** este o platformă pentru fotbal amator în București: jucătorii rezervă terenuri, creează și se înscriu la meciuri pe categorii de vârstă, participă la campionate și au un **rank** care se actualizează după fiecare meci, în funcție de nivelul real al celorlalți jucători.

**Product Goal:** Să oferim jucătorilor amatori de fotbal o platformă unde găsesc rapid meciuri echilibrate pe categoria lor de vârstă, joacă în campionate organizate și își urmăresc progresul printr-un sistem de rank.

## Surse de adevăr

- [Requirements Document.md](Requirements%20Document.md): cerințe funcționale (CFx), nefuncționale și use case-uri.
- [product-backlog-sintetico.md](product-backlog-sintetico.md): user stories (US-xx), criterii de acceptare, priorități și dependențe.
- [Architecture.md](Architecture.md): stack-ul tehnic.
- [Decisions.md](Decisions.md): jurnalul schimbărilor și deciziilor. Orice schimbare de cerințe, backlog, arhitectură sau mod de lucru se trece aici ca rând nou, sus în tabel: data și o descriere scurtă, fără să repete ce e deja în celelalte documente.

Citește documentul relevant înainte de a implementa un story. Dacă o regulă nu e specificată acolo, întreabă în loc să presupui. Nu implementa funcționalități care nu sunt în backlog.

## Stack tehnic

**Frontend (mobil):** React Native + Expo + TypeScript, Expo Router (navigare), `expo-secure-store` (stocare token), `expo-notifications` (push).

**Backend:** Node.js + TypeScript + Express, PostgreSQL + Prisma, Zod (validare), Socket.IO (chat), Jest + Supertest (teste și coverage).

**Infrastructură:** PostgreSQL rulează în Docker Compose (`db` pentru dezvoltare, `db-test` pentru teste). Instrucțiunile sunt în [README.md](README.md).

Nu introduce alte biblioteci sau tehnologii majore fără acordul echipei.

**Variabile de mediu:** `.env` nu se urcă pe GitHub. Orice variabilă nouă se adaugă și în `.env.example`, cu o valoare de exemplu.

## Reguli de domeniu

**Actori:** Jucător, Organizator de campionat (specializare a Jucătorului), Administrator de teren, Administrator.

**Categorii de vârstă:** U12, U15, U18, Seniori, Veterani 35+. Se calculează automat din data nașterii, nu se editează direct și se recalculează la schimbarea datei sau la trecerea unui prag de vârstă.

**Rank:**
- Rank-ul mediu al meciului (R_med) se calculează din rank-urile jucătorilor înscriși și se recalculează la fiecare înscriere sau anulare.
- La victorie: R < R_med câștigă mai mult, R > R_med câștigă mai puțin.
- La înfrângere: R > R_med pierde mai mult, R < R_med pierde mai puțin.
- Variația are o limită minimă și una maximă. Rank-ul nu poate deveni negativ.
- Actualizarea după meci este **atomică** (toți jucătorii sau niciunul), deci se face într-o tranzacție.
- Formula de calcul stă într-un modul separat, fără dependențe de baza de date, documentată și acoperită de teste unitare.

**Terenuri și rezervări:**
- Numărul de jucători al unui teren este doar o **recomandare**, nu o limită strictă.
- Două rezervări nu se pot suprapune pe același teren. Intervalele indisponibile nu se pot rezerva.

**Meciuri:**
- Înscrierea e permisă doar dacă există locuri libere și categoria jucătorului corespunde. Nu se permite înscrierea dublă.
- Un rezultat validat nu se mai poate modifica, cu excepția corecturii făcute de Administrator în urma unei contestații.

## Cerințe nefuncționale

- **Securitate:** parolele se stochează hash-uite, autentificarea se face cu token care expiră. Datele minorilor se tratează conform GDPR (consimțământ parental sub 16 ani).
- **Performanță:** lista de meciuri și leaderboard-ul se încarcă în sub 2 secunde pentru cel puțin 1000 de utilizatori (indexuri, paginare).
- **Consistență:** operațiile care modifică mai multe entități legate se fac atomic.
- **Validare:** toate datele de intrare din API se validează cu Zod.
- **Mentenabilitate:** logica nouă vine cu teste unitare, iar code coverage-ul se măsoară cu Jest.
- **Utilizabilitate:** interfața este gândită pentru telefon.

## Convenții

- Documentația și textele din aplicație sunt în **limba română**. Numele din cod (variabile, funcții, modele Prisma) sunt în engleză.
- Referă story-urile prin ID (`US-xx`) și cerințele prin `CFx` în commit-uri și PR-uri.
- Coloana SP (Story Points) din backlog o completează echipa după Planning Poker; nu o completa tu.
- Nu modifica prioritățile sau conținutul backlog-ului fără cerere explicită.
- Fiecare lucrează pe branch-ul propriu, iar modificările ajung în `main` prin PR.
