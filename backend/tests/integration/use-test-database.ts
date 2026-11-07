import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Încarcă .env-ul din rădăcina repo-ului și redirecționează aplicația spre baza de test,
 * înainte ca vreun test să importe PrismaClient. Așa testele nu ating niciodată baza de dezvoltare.
 */
export function useTestDatabase() {
  const rootEnv = path.resolve(__dirname, "..", "..", "..", ".env");
  if (existsSync(rootEnv)) {
    process.loadEnvFile(rootEnv);
  }

  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) {
    throw new Error("DATABASE_URL_TEST lipsește din .env (vezi .env.example).");
  }

  process.env.DATABASE_URL = testUrl;
  process.env.NODE_ENV = "test";
  return testUrl;
}

useTestDatabase();
