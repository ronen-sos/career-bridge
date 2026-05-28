import { execSync } from "node:child_process";

const databaseUrl =
  process.env.DATABASE_URL ?? process.env.DATABASE_PRIVATE_URL;

if (!databaseUrl) {
  console.error(`
ERROR: DATABASE_URL is not set.

Railway setup:
1. Add a PostgreSQL service to your project
2. Open your web service → Variables → New Variable → Add Reference
3. Select the Postgres service → choose DATABASE_URL
4. Redeploy

Without this, Prisma cannot run migrations and the app cannot connect to the database.
`);
  process.exit(1);
}

console.log("Running database migrations...");
execSync("npx prisma migrate deploy", { stdio: "inherit" });

console.log("Starting application...");
execSync("npm start", { stdio: "inherit" });
