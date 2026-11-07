# Sintetico

Platformă pentru fotbal amator în București: rezervare de terenuri, meciuri pe categorii de vârstă, campionate și un sistem de rank.

Documentația proiectului:
- [Requirements Document.md](Requirements%20Document.md)
- [product-backlog-sintetico.md](product-backlog-sintetico.md)
- [Architecture.md](Architecture.md)
- [Decisions.md](Decisions.md)

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

### Reguli

- `.env` nu se urcă pe GitHub. Variabilele noi se adaugă în `.env.example`, cu valori de exemplu.
- Parolele din `.env.example` sunt doar pentru dezvoltare locală.
