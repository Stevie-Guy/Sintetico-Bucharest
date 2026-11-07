/**
 * Două proiecte Jest:
 *  - unit:        logică pură, fără bază de date;
 *  - integration: API-ul prin Supertest, pe baza de test (db-test din docker-compose.yml).
 *
 * @type {import('jest').Config}
 */
const tsJest = { "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }] };

// Clientul generat de Prisma importă fișiere TS cu extensia `.js`; Jest trebuie să caute fișierul `.ts`.
const moduleNameMapper = { "^(\\.{1,2}/.*)\\.js$": "$1" };

module.exports = {
  collectCoverageFrom: ["src/**/*.ts", "!src/generated/**", "!src/server.ts", "!src/scripts/**"],
  coverageDirectory: "coverage",
  projects: [
    {
      displayName: "unit",
      testEnvironment: "node",
      transform: tsJest,
      moduleNameMapper,
      testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
    },
    {
      displayName: "integration",
      testEnvironment: "node",
      transform: tsJest,
      moduleNameMapper,
      testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
      globalSetup: "<rootDir>/tests/integration/global-setup.ts",
      setupFiles: ["<rootDir>/tests/integration/use-test-database.ts"],
    },
  ],
};
