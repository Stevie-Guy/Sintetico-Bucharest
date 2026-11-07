import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 nu mai citește singur .env-ul. Folosim fișierul .env din rădăcina repo-ului,
// același cu cel din docker-compose.yml.
const rootEnv = path.resolve(__dirname, "..", ".env");
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Fallback gol, ca `prisma generate` să meargă și fără bază de date configurată.
    url: process.env.DATABASE_URL ?? "",
  },
});
