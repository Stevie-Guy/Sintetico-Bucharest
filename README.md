# Sintetico

Platformă pentru fotbal amator în București: rezervare de terenuri, meciuri pe categorii de vârstă, campionate și un sistem de rank.

Documentația proiectului:
- [Requirements Document.md](Requirements%20Document.md)
- [product-backlog-sintetico.md](product-backlog-sintetico.md)
- [Architecture.md](Architecture.md)
- [Decisions.md](Decisions.md)

## Rularea backend-ului

După configurarea `.env` în rădăcină și pornirea bazelor de date:

```bash
cd backend
npm ci
npm run db:migrate
npm run typecheck
npm test
npm run dev
```

API-ul pornește implicit la `http://localhost:3000`.
Migrația nouă `20261117040000_create_matches` adaugă tabelele meciurilor și
participanților; nu șterge rezervările existente. Migrația
`20261118120000_dominant_foot_ambidextrous` adaugă valoarea AMBIDEXTRU la piciorul dominant.

## Docker

Baza de date PostgreSQL rulează în Docker, ca toată echipa să lucreze cu aceeași versiune și configurare. Backend-ul și aplicația mobilă rulează local.

| Serviciu | Rol | Port pe calculatorul tău | Date |
|---|---|---|---|
| `db` | Baza de date pentru dezvoltare | 5432 | Se păstrează în volumul `db-data` |
| `db-test` | Baza de date pentru teste | 5433 | În memorie, goală la fiecare repornire |

### Cerințe

- [Docker Desktop](https://www.docker.com/products/docker-desktop/). Pe Windows are nevoie de WSL2; instalatorul îl configurează.
- Docker Desktop trebuie să fie pornit înainte de comenzile de mai jos.

### Prima pornire

```bash
cp .env.example .env
docker compose up -d
docker compose ps
```

Înainte de `docker compose up`, în `.env` înlocuiește `schimba_parola` cu o parolă aleasă de tine, în toate cele trei locuri (`POSTGRES_PASSWORD`, `DATABASE_URL`, `DATABASE_URL_TEST`).

Ambele servicii trebuie să apară cu starea `healthy`.

Dacă ai deja un PostgreSQL instalat local pe portul 5432, schimbă `POSTGRES_PORT` în `.env` (ex. `5434`) și portul din `DATABASE_URL`.

### Comenzi utile

| Comandă | Ce face |
|---|---|
| `docker compose up -d` | Pornește bazele de date în fundal |
| `docker compose down` | Oprește containerele; datele de dezvoltare rămân |
| `docker compose down -v` | Oprește containerele și **șterge** datele de dezvoltare |
| `docker compose restart db-test` | Golește baza de test |
| `docker compose logs -f db` | Afișează log-urile bazei de date |
| `docker compose exec db psql -U sintetico -d sintetico` | Deschide o consolă SQL |

### Conectarea backend-ului

Backend-ul citește conexiunea din `.env`:
- `DATABASE_URL` pentru dezvoltare;
- `DATABASE_URL_TEST` pentru teste.

Pentru baza de test, migrațiile Prisma se aplică înainte de rularea testelor, cu `DATABASE_URL` setat la valoarea lui `DATABASE_URL_TEST`.

### Conectarea aplicației mobile

Aplicația Expo rulează pe telefon sau în emulator, deci nu poate folosi `localhost` pentru backend. Folosește IP-ul calculatorului din rețeaua locală (ex. `http://192.168.1.10:3000`). Telefonul și calculatorul trebuie să fie în aceeași rețea.

## Backend

Cerințe: Node.js 22 sau mai nou și bazele de date pornite (`docker compose up -d`).

```bash
cd backend
npm install            # generează și clientul Prisma
npm run db:migrate     # aplică migrațiile pe baza de dezvoltare
npm run dev            # pornește API-ul pe http://localhost:3000 (se repornește la modificări)
```

| Comandă | Ce face |
|---|---|
| `npm test` | Rulează toate testele (unit + integrare pe `db-test`) |
| `npm run test:unit` | Doar testele unitare, fără bază de date |
| `npm run test:coverage` | Testele, plus raportul de coverage în `backend/coverage/` |
| `npm run typecheck` | Verifică tipurile TypeScript |
| `npm run db:migrate -- --name <descriere>` | Creează o migrație nouă după o modificare în `schema.prisma` |
| `npm run create-admin` | Creează contul de Administrator din `ADMIN_EMAIL` și `ADMIN_PASSWORD` (în `.env`) |
| `npm run db:seed` | Șterge și recreează datele demo în baza de dezvoltare (vezi „Date demo”) |

Testele de integrare aplică singure migrațiile pe `db-test` înainte să ruleze.

### Contul de Administrator

Contul de Administrator nu se poate crea din aplicație. Setează `ADMIN_EMAIL` și `ADMIN_PASSWORD` în `.env`, apoi rulează `npm run create-admin` în `backend/`. Comanda se poate rula de mai multe ori. Dacă emailul are deja cont, contul devine Administrator, primește parola din `.env` și e deconectat de pe toate dispozitivele.

În aplicație, Administratorul alege din ecranul „Contul meu” din perspectiva cărui tip de cont vede aplicația.

### Date demo (pentru prezentare)

`npm run db:seed` (în `backend/`) umple baza de dezvoltare cu date demo: 19 conturi, 6 terenuri în toate sectoarele, cu program și intervale de la acum 2 zile până peste 7 zile, rezervări în toate stările, notificări și 9 meciuri viitoare (unul plin, unul pentru veterani și unul U18). Datele se calculează față de ziua curentă, deci rulează comanda din nou înainte de prezentare. La fiecare rulare, conturile `@demo.sintetico.ro` se șterg și se creează din nou. Celelalte conturi rămân neatinse.

Toate conturile demo au parola `Sintetico1!`:

| Cont | Rol |
|---|---|
| `andrei.popescu@demo.sintetico.ro` | Jucător (Seniori): meciuri, rezervări în toate stările, notificări necitite |
| `ion.ionescu@demo.sintetico.ro` | Administrator de teren: 3 terenuri, cereri de rezervare de aprobat |
| `maria.dobre@demo.sintetico.ro` | Administrator de teren: alte 3 terenuri |
| `radu.marin@demo.sintetico.ro` | Organizator de campionat |
| `dan.voicu@demo.sintetico.ro` | Jucător (Veterani 35+) |
| `luca.preda@demo.sintetico.ro` | Jucător (U18) |

## Aplicația mobilă

```bash
cd mobile
cp .env.example .env   # adresa backend-ului se deduce singură; vezi comentariile din fișier
npm install
npm start              # scanează codul QR cu Expo Go
```

### Pe desktop, în browser

```bash
cd mobile
npm run web            # deschide aplicația pe http://localhost:8081
```

Nu e nevoie să scrii IP-ul calculatorului în `mobile/.env`. Cu `EXPO_PUBLIC_API_URL` goală, aplicația deduce singură adresa backend-ului: în browser folosește host-ul paginii, iar pe telefon IP-ul calculatorului pe care rulează Expo. Merge și după schimbarea rețelei Wi-Fi; repornește doar Expo. Setează `EXPO_PUBLIC_API_URL` numai dacă backend-ul rulează pe alt calculator sau folosești `expo start --tunnel`. După ce modifici `.env`, repornește Expo.

Varianta web e pentru verificări rapide; aplicația e gândită pentru telefon, așa că unele detalii arată diferit. Backend-ul acceptă cereri din browser doar de la originile din `CORS_ORIGINS` (în `.env`, implicit `http://localhost:8081`).

### Eroare `EPERM` la `npm install`

Dacă Node.js e instalat într-un folder unde nu ai drept de scriere (ex. `D:\nodejs`), npm nu își poate scrie cache-ul acolo. Mută cache-ul în folderul tău de utilizator, o singură dată (PowerShell):

```powershell
npm config set cache "$env:LOCALAPPDATA\npm-cache"
```

## Variabile de mediu

- `.env` (rădăcină) e folosit de Docker și backend; `mobile/.env` de aplicația mobilă.
- `.env` nu se urcă pe GitHub. Variabilele noi se adaugă în `.env.example`, cu valori de exemplu.
- `.env.example` nu conține parole reale, doar valori de exemplu (`schimba_parola`) sau câmpuri goale (`ADMIN_PASSWORD`). Valorile reale stau doar în `.env`.
