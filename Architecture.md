# Frontend
- React Native + Expo + TypeScript
- Expo Router (navigare)
- expo-secure-store (token-ul)
- expo-notifications (push)

# Backend
- Node.js + TypeScript + Express
- PostgreSQL + Prisma
- Zod (validare)
- Socket.IO (chat)
- Jest + Supertest (teste și coverage)

# Infrastructură
- Docker Compose (PostgreSQL pentru dezvoltare și pentru teste)

# Structura repo-ului

```
.env.example            variabile pentru Docker și backend (copiat în .env)
docker-compose.yml      PostgreSQL: db (dezvoltare) și db-test (teste)
backend/
  prisma/               schema.prisma și migrațiile
  prisma.config.ts      configurarea Prisma (citește ../.env)
  src/
    app.ts              aplicația Express (fără listen, folosită și de teste)
    server.ts           pornirea serverului
    config/env.ts       variabilele de mediu, validate cu Zod
    lib/prisma.ts       instanța unică de PrismaClient
    errors/             AppError: erori cu mesaj pentru utilizator
    middleware/         CORS, autentificare (requireAuth), roluri (requireRole), validarea corpului cererii (Zod), tratarea erorilor
    modules/<domeniu>/  câte un folder pe domeniu: rute, scheme Zod, servicii
    scripts/            comenzi rulate manual cu `npm run` (ex. create-admin), excluse din coverage
    generated/prisma/   clientul Prisma generat (nu se urcă pe GitHub)
  tests/
    unit/               logică pură, fără bază de date
    integration/        API-ul prin Supertest, pe db-test
mobile/
  .env.example          EXPO_PUBLIC_API_URL (copiat în mobile/.env)
  src/
    app/                ecranele (Expo Router: fiecare fișier e o rută)
    api/                clientul HTTP
    components/         componente comune (formulare, butoane, liste de opțiuni)
    features/<domeniu>/ apeluri API și logică pe domenii
```

# Versiuni folosite

| Componentă | Versiune | Observații |
|---|---|---|
| Node.js | 22+ | Se folosesc `--env-file` și `process.loadEnvFile`, fără `dotenv`. |
| TypeScript | 6.x | `ts-jest` nu suportă încă TypeScript 7. |
| Express | 5.x | Erorile din handler-ele `async` ajung singure la error handler. |
| Prisma | 7.x | Folosește adaptorul `@prisma/adapter-pg` și `prisma.config.ts`. `migrate dev` nu mai regenerează clientul, de aceea după `npm run db:migrate` rulează automat `prisma generate` (scriptul `postdb:migrate`). |
| Zod | 4.x | |
| Jest | 30.x | Rulează cu `--experimental-vm-modules`, cerut de clientul Prisma 7. |
| Expo SDK | 58 | |

# Convenții API

- Toate rutele sunt sub `/api` (ex. `POST /api/auth/register`).
- Corpul fiecărei cereri se validează cu o schemă Zod (`validateBody`).
- Rutele protejate folosesc middleware-ul `requireAuth` și cer antetul `Authorization: Bearer <token>`. Fără sesiune validă răspund cu 401. Token-ul se obține de la `POST /api/auth/login`.
- Rutele permise doar unor roluri adaugă `requireRole(...)` după `requireAuth`. Un rol nepermis primește 403 cu codul `FORBIDDEN`. Regulile de moștenire între roluri stau într-un singur loc: `hasRole` din `modules/auth/roles.ts`.
- În aplicația mobilă, ecranele aleg ce afișează după `activeRole` din `useAuth()`, nu după `user.role`, ca Administratorul să poată schimba perspectiva.
- În aplicația mobilă, token-ul stă în `expo-secure-store`; în browser (`npm run web`), în `localStorage`, doar pentru dezvoltare.
- CORS: API-ul acceptă cereri din browser doar de la originile din `CORS_ORIGINS`. Aplicația de pe telefon nu are nevoie de CORS; e folosit pentru varianta web a aplicației (`npm run web` în `mobile/`).
- Erorile au mereu forma `{ "error": { "code", "message", "fields"? } }`: `code` în engleză pentru cod, `message` în română pentru utilizator, `fields` cu erorile pe fiecare câmp.
