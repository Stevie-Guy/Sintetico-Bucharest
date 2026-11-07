# Decisions

Jurnalul schimbărilor și deciziilor din proiectul Sintetico. Fiecare rând spune ce s-a schimbat și, când se știe, de ce; detaliile rămân în documentele proiectului. Cele mai recente schimbări sunt sus.

| Data | Schimbare |
|---|---|
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
