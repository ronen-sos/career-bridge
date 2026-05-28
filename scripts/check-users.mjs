import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

try {
  const users = await db.user.findMany({
    select: { email: true, role: true, name: true },
  });
  console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);
  console.log("Users in database:", users.length);
  console.log(JSON.stringify(users, null, 2));
} catch (error) {
  console.error("Database error:", error instanceof Error ? error.message : error);
} finally {
  await db.$disconnect();
}
