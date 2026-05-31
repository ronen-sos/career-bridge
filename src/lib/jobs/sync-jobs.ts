import { db } from "@/lib/db";
import {
  fetchAllTargetedListings,
  isAdzunaConfigured,
  type AdzunaJob,
} from "@/lib/jobs/adzuna-client";
import { JOB_SEARCH_ZIP, JOB_SYNC_STALE_HOURS } from "@/lib/jobs/constants";
import {
  extractSourceFromUrl,
  formatPayRange,
  inferRequirements,
  scoreRecoveryFriendliness,
  stripHtml,
  truncate,
} from "@/lib/jobs/recovery-friendly";

export type JobSyncResult = {
  status: "success" | "skipped" | "error";
  jobsFound: number;
  jobsUpserted: number;
  jobsDeactivated: number;
  message?: string;
};

function normalizeListing(job: AdzunaJob & { searchQuery: string }) {
  const description = truncate(stripHtml(job.description ?? ""), 1200);
  const recovery = scoreRecoveryFriendliness(job.title, description);

  if (!recovery.isRecoveryFriendly) {
    return null;
  }

  const url = job.redirect_url.trim();
  const company = job.company?.display_name?.trim() || "Employer not listed";
  const location =
    job.location?.display_name?.trim() ||
    job.location?.area?.join(", ") ||
    "St. Paul, MN area";

  return {
    externalId: String(job.id),
    title: job.title.trim(),
    company,
    location,
    description,
    requirements: inferRequirements(description),
    payRange: formatPayRange(job.salary_min, job.salary_max),
    url,
    source: extractSourceFromUrl(url),
    latitude: job.location?.latitude ?? null,
    longitude: job.location?.longitude ?? null,
    isRecoveryFriendly: true,
    postedAt: new Date(job.created),
    searchQuery: job.searchQuery,
  };
}

export async function getLastSuccessfulSyncAt(): Promise<Date | null> {
  const last = await db.jobSyncLog.findFirst({
    where: { status: "success" },
    orderBy: { ranAt: "desc" },
    select: { ranAt: true },
  });

  return last?.ranAt ?? null;
}

export async function syncJobsIfStale(): Promise<void> {
  const lastSync = await getLastSuccessfulSyncAt();
  if (
    lastSync &&
    Date.now() - lastSync.getTime() < JOB_SYNC_STALE_HOURS * 60 * 60 * 1000
  ) {
    return;
  }

  await syncJobs();
}

export async function syncJobs(): Promise<JobSyncResult> {
  if (!isAdzunaConfigured()) {
    const result: JobSyncResult = {
      status: "skipped",
      jobsFound: 0,
      jobsUpserted: 0,
      jobsDeactivated: 0,
      message: "ADZUNA_APP_ID and ADZUNA_APP_KEY are not configured.",
    };

    await db.jobSyncLog.create({
      data: {
        status: result.status,
        message: result.message,
      },
    });

    return result;
  }

  try {
    const rawListings = await fetchAllTargetedListings();
    const normalized = rawListings
      .map(normalizeListing)
      .filter((job): job is NonNullable<typeof job> => job !== null);

    const activeExternalIds: string[] = [];
    let jobsUpserted = 0;

    for (const job of normalized) {
      activeExternalIds.push(job.externalId);

      await db.jobOpportunity.upsert({
        where: { externalId: job.externalId },
        create: {
          externalId: job.externalId,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          requirements: job.requirements,
          payRange: job.payRange,
          url: job.url,
          source: job.source,
          latitude: job.latitude,
          longitude: job.longitude,
          isRecoveryFriendly: job.isRecoveryFriendly,
          isActive: true,
          postedAt: job.postedAt,
          syncedAt: new Date(),
        },
        update: {
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          requirements: job.requirements,
          payRange: job.payRange,
          url: job.url,
          source: job.source,
          latitude: job.latitude,
          longitude: job.longitude,
          isRecoveryFriendly: job.isRecoveryFriendly,
          isActive: true,
          postedAt: job.postedAt,
          syncedAt: new Date(),
        },
      });

      jobsUpserted += 1;
    }

    let jobsDeactivated = 0;

    if (activeExternalIds.length > 0) {
      const deactivated = await db.jobOpportunity.updateMany({
        where: {
          externalId: { notIn: activeExternalIds },
          isActive: true,
        },
        data: { isActive: false },
      });
      jobsDeactivated = deactivated.count;
    }

    await db.jobSyncLog.create({
      data: {
        status: "success",
        jobsFound: rawListings.length,
        jobsUpserted,
        jobsDeactivated,
        message: `Synced ${jobsUpserted} recovery-friendly listings near ${JOB_SEARCH_ZIP}.`,
      },
    });

    return {
      status: "success",
      jobsFound: rawListings.length,
      jobsUpserted,
      jobsDeactivated,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown job sync error";

    await db.jobSyncLog.create({
      data: {
        status: "error",
        message,
      },
    });

    return {
      status: "error",
      jobsFound: 0,
      jobsUpserted: 0,
      jobsDeactivated: 0,
      message,
    };
  }
}
