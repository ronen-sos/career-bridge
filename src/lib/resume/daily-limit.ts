import { db } from "@/lib/db";
import { resumeRetentionCutoff } from "@/lib/resume/retention";

export const RESUME_DAILY_LIMIT = 10;

function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export async function getResumeDailyUsage(userId: string) {
  const since = startOfUtcDay();

  const usedToday = await db.resumeGeneration.count({
    where: {
      userId,
      createdAt: { gte: since },
    },
  });

  return {
    usedToday,
    remainingToday: Math.max(0, RESUME_DAILY_LIMIT - usedToday),
    limit: RESUME_DAILY_LIMIT,
  };
}

export async function recordResumeGeneration(
  userId: string,
  contentMarkdown: string,
  targetRole?: string,
  targetCompany?: string,
) {
  await db.resumeGeneration.create({
    data: {
      userId,
      contentMarkdown,
      targetRole: targetRole ?? null,
      targetCompany: targetCompany ?? null,
    },
  });
}

export async function listSavedResumes(userId: string) {
  return db.resumeGeneration.findMany({
    where: {
      userId,
      createdAt: { gte: resumeRetentionCutoff() },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      targetRole: true,
      targetCompany: true,
      createdAt: true,
    },
  });
}
