import { execSync } from "node:child_process";
import path from "node:path";
import { useTestDatabase } from "./use-test-database";

/** Rulează o dată înainte de testele de integrare: aplică migrațiile pe baza de test. */
export default function globalSetup() {
  const testUrl = useTestDatabase();
  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(__dirname, "..", ".."),
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: "inherit",
  });
}
