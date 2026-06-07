import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
  prismaSchemaVersion?: string;
};

/** Bump when schema changes so dev hot-reload picks up new Prisma client fields. */
const PRISMA_SCHEMA_VERSION = "20260607-job-interviews-v1";

const DEFAULT_POOL_MAX = 5;

function weeklyGoalModelHasEmploymentHoursOnly(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Prisma } = require("@/generated/prisma/client") as {
      Prisma?: {
        dmmf?: {
          datamodel?: {
            models?: Array<{ name: string; fields: Array<{ name: string }> }>;
          };
        };
      };
    };
    const weeklyGoal = Prisma?.dmmf?.datamodel?.models?.find(
      (model) => model.name === "WeeklyGoal",
    );
    const names = weeklyGoal?.fields.map((field) => field.name) ?? [];
    return (
      names.includes("targetEmploymentHours") &&
      !names.includes("targetJobSeekingHours")
    );
  } catch {
    return false;
  }
}

function isStalePrismaClient(client: PrismaClient): boolean {
  const c = client as PrismaClient & {
    profile?: unknown;
    goalDailyUpdate?: unknown;
    goalCustomItem?: unknown;
    jobApplication?: unknown;
    jobInterview?: unknown;
  };
  if (!c.profile || !c.goalDailyUpdate || !c.goalCustomItem) return true;
  if (!c.jobApplication || !c.jobInterview) return true;
  return !weeklyGoalModelHasEmploymentHoursOnly();
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? process.env.DATABASE_PRIVATE_URL ?? "";
}

function getPoolMax(): number {
  const configured = Number(process.env.DATABASE_POOL_MAX);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }
  return DEFAULT_POOL_MAX;
}

function getPool() {
  if (!globalForPrisma.pool) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Add it to your .env file or Railway variables.",
      );
    }

    globalForPrisma.pool = new Pool({
      connectionString,
      max: getPoolMax(),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return globalForPrisma.pool;
}

function createPrismaClient() {
  const adapter = new PrismaPg(getPool());
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  if (globalForPrisma.prismaSchemaVersion !== PRISMA_SCHEMA_VERSION) {
    globalForPrisma.prisma = undefined;
    globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  }

  const existing = globalForPrisma.prisma;
  if (existing && isStalePrismaClient(existing)) {
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
