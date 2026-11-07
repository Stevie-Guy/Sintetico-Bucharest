/**
 * Creează (sau actualizează) contul de Administrator din ADMIN_EMAIL și ADMIN_PASSWORD din .env.
 *
 *   cd backend
 *   npm run create-admin
 *
 * Dacă emailul are deja cont, contul devine ADMIN și primește parola din .env.
 */
import { AppError } from "../errors/app-error";
import { prisma } from "../lib/prisma";
import { upsertAdmin } from "../modules/auth/admin.service";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Setează ADMIN_EMAIL și ADMIN_PASSWORD în .env (vezi .env.example).");
  }

  const admin = await upsertAdmin({ email, password });
  console.log(`Contul de Administrator ${admin.email} este gata.`);
}

main()
  .catch((err) => {
    if (err instanceof AppError && err.fields) {
      console.error(err.message);
      for (const [field, messages] of Object.entries(err.fields)) {
        for (const message of messages) console.error(`  ${field}: ${message}`);
      }
    } else {
      console.error(err instanceof Error ? err.message : err);
    }
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
