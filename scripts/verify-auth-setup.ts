import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

const email = "steve@thriveinmn.com";

async function main() {
  console.log("Auth setup check\n");
  console.log("AUTH_SECRET set:", !!process.env.AUTH_SECRET);
  console.log("AUTH_URL:", process.env.AUTH_URL ?? "(not set)");
  console.log("AUTH_GOOGLE_ID set:", !!process.env.AUTH_GOOGLE_ID);
  console.log("AUTH_GOOGLE_SECRET set:", !!process.env.AUTH_GOOGLE_SECRET);
  console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);

  try {
    const user = await db.user.findUnique({ where: { email } });
    console.log(`\nUser ${email}:`, user ? `found (${user.role})` : "NOT FOUND — run npm run db:seed");
  } catch (error) {
    console.error("\nDatabase error:", error instanceof Error ? error.message : error);
  } finally {
    await db.$disconnect();
  }

  console.log("\nGoogle Console checklist:");
  console.log("1. OAuth consent screen → Test users → add steve@thriveinmn.com");
  console.log("2. Credentials → redirect URI: http://localhost:3000/api/auth/callback/google");
  console.log("   (and your Railway URL if testing production)");
}

main();
