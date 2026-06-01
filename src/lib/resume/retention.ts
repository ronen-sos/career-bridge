import { db } from "@/lib/db";

export const RESUME_RETENTION_DAYS = 60;

export function resumeRetentionCutoff(): Date {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - RESUME_RETENTION_DAYS);
  return cutoff;
}

export async function purgeExpiredResumes(userId?: string) {
  await db.resumeGeneration.deleteMany({
    where: {
      createdAt: { lt: resumeRetentionCutoff() },
      ...(userId ? { userId } : {}),
    },
  });
}

export function daysUntilResumeExpires(createdAt: Date): number {
  const expiresAt = new Date(createdAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + RESUME_RETENTION_DAYS);
  const ms = expiresAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
