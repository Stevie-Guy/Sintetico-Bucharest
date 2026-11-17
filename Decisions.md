# Decisions

Jurnalul schimbărilor și deciziilor din proiectul Sintetico. Fiecare rând spune ce s-a schimbat și, când se știe, de ce; detaliile rămân în documentele proiectului. Cele mai recente schimbări sunt sus.

| Data | Schimbare |
|---|---|
| 2026-11-17 | `.env.example` nu mai conține parola bazei de date: `POSTGRES_PASSWORD` și parola din `DATABASE_URL`/`DATABASE_URL_TEST` sunt înlocuite cu placeholder-ul `schimba_parola`. Motiv: fișierul se urcă pe GitHub; valorile reale stau doar în `.env`. |
| 2026-11-07 | S-a adăugat rolul Administrator (`ADMIN`). Contul lui nu se creează din aplicație: înregistrarea refuză în continuare acest rol, iar contul se creează cu `npm run create-admin`, din `ADMIN_EMAIL` și `ADMIN_PASSWORD` din `.env`. Dacă emailul are deja cont, contul devine Administrator, primește parola nouă și îi sunt șterse sesiunile. |
| 2026-11-07 | Administratorul poate comuta în aplicație între perspectivele tuturor rolurilor (Administrator, Jucător, Administrator teren, Organizator campionate), ca să vadă aplicația din punctul de vedere al fiecăruia. În backend trece de orice verificare de rol, deci poate și să facă acțiunile rolului ales, nu doar să le vadă. Perspectiva aleasă se ține doar în memorie; la o nouă autentificare adminul pornește din perspectiva lui. |
| 2026-11-07 | `npm run db:migrate -- --name <x>` nu transmitea numele migrației, care ajungea la `prisma generate`. `prisma generate` rulează acum separat, din scriptul `postdb:migrate`. |
| 2026-11-07 | US-01: formularul de creare cont are și câmpul „Confirmă parola”; contul nu se poate crea dacă parolele nu coincid. Verificarea se face doar în aplicație, pentru că are rolul de a prinde greșelile de tastare; API-ul primește în continuare o singură parolă. |
| 2026-11-07 | US-02: autentificarea folosește token-uri de sesiune opace, salvate ca hash în tabelul `sessions`, nu JWT. Motiv: deconectarea invalidează token-ul imediat și nu e nevoie de o bibliotecă nouă. Fiecare autentificare creează o sesiune separată, deci deconectarea de pe un dispozitiv nu le afectează pe celelalte. |
| 2026-11-07 | US-02: sesiunea expiră după 7 zile de la autentificare (`SESSION_TTL_HOURS`), fără prelungire la folosire. La date greșite, mesajul e același pentru email inexistent și parolă greșită, ca să nu se poată afla ce emailuri au cont. |
| 2026-11-07 | Aplicația mobilă poate rula și în browser (Expo pentru web: `react-native-web`, `react-dom`), ca echipa să o verifice rapid pe desktop. Backend-ul are un CORS minimal, scris în proiect, fără biblioteca `cors`, limitat la originile din `CORS_ORIGINS`. Platforma țintă rămâne telefonul. |
| 2026-11-07 | `CLAUDE.md` cere ca după fiecare schimbare să se actualizeze `Architecture.md` (doar partea tehnică) și `Decisions.md`. |
| 2026-11-07 | US-01: la crearea contului utilizatorul alege tipul de cont: Jucător, Administrator teren sau Organizator campionate. Organizatorul are și drepturile unui jucător. Contul de Administrator nu se poate crea din aplicație. |
| 2026-11-07 | US-01: regulile minime ale parolei sunt cel puțin 8 caractere, o literă mare, o cifră și un caracter special. S-a adăugat și o limită maximă de 128 de caractere, ca protecție pentru funcția de hashing. Regulile se pot schimba pe parcurs. |
| 2026-11-07 | Parolele se hash-uiesc cu scrypt din Node.js, fără bibliotecă externă (bcrypt/argon2), ca să nu adăugăm dependențe native. Emailul se salvează cu litere mici, ca unicitatea să nu depindă de majuscule. |
| 2026-11-07 | S-au creat proiectele `backend/` (Express + Prisma + Jest) și `mobile/` (Expo + Expo Router). Versiuni: Prisma 7 (stabil, nu 8 RC), TypeScript 6 (ts-jest nu suportă încă 7), Expo SDK 58. Structura și convențiile sunt în `Architecture.md`. |
| 2026-11-07 | PostgreSQL rulează în Docker Compose: o bază de dezvoltare și una separată pentru teste. Backend-ul și aplicația Expo rulează local, pentru reîncărcare rapidă; backend-ul poate fi containerizat mai târziu. Motiv: aceeași versiune și configurare de bază de date pentru toată echipa. |
| 2026-11-07 | S-a adăugat `Decisions.md`, un jurnal al schimbărilor și deciziilor, ca să se poată urmări ce s-a schimbat și când, fără să se caute prin istoricul git. |
| 2026-11-07 | `CLAUDE.md` conține doar reguli generale (domeniu, cerințe nefuncționale, convenții), fără stadiul proiectului, priorități sau decizii deschise, pentru că informația temporară se desincronizează. |
| 2026-11-07 | S-a adăugat `CLAUDE.md` cu instrucțiuni pentru Claude Code. |
| 2026-11-01 | S-a ales stack-ul tehnic: React Native + Expo pe frontend, Node.js + Express + PostgreSQL pe backend. Aplicația devine mobilă; prima versiune a cerințelor o descria ca platformă web. |
| 2026-10-19 | S-a scos formula de rank propusă inițial (cu K și rank de start fixe). Rămâne doar regula calitativă față de rank-ul mediu al meciului, iar formula exactă o stabilește echipa. |
| 2026-10-19 | Actor nou, Administratorul de teren, care gestionează terenurile, programul și rezervările. Crearea unui meci presupune acum un teren rezervat. |
| 2026-10-19 | Revizia cerințelor funcționale CF1, CF8, CF9, CF10, CF13 și CF14: câmpuri noi în profil, filtrare pe sector în leaderboard, premii la campionate, mai puține tipuri de conversații, notificare nouă de confirmare a participării. |
| 2026-10-19 | S-a renunțat la istoricul modificărilor de rank și la urma lăsată în istoric de corectarea rezultatelor. |
| 2026-10-19 | Mai multe funcționalități au fost scoase temporar din backlog, ca primul Increment să acopere doar fluxul minim (cont → meci → rank actualizat). |
| 2026-10-19 | S-a adăugat Product Backlog-ul, cu story-uri prioritizate Must/Should, și diagrama Use Case. |
| 2026-10-19 | S-a adăugat Requirements Document, prima variantă a cerințelor. |
