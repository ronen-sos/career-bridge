import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { JobsExplorer } from "@/components/JobsExplorer";
import {
  getLastSuccessfulSyncAt,
  syncJobsIfStale,
} from "@/lib/jobs/sync-jobs";
import { isAdzunaConfigured } from "@/lib/jobs/adzuna-client";
import {
  JOB_DEFAULT_RADIUS_MILES,
  JOB_SEARCH_ZIP,
  JOB_SYNC_RADIUS_MILES,
} from "@/lib/jobs/constants";

function formatLastUpdated(date: Date | null): string | null {
  if (!date) return null;

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function JobsPage() {
  await requireAuth();

  void syncJobsIfStale().catch((error) => {
    console.error("[jobs] background sync failed:", error);
  });

  const [jobs, lastSyncAt] = await Promise.all([
    db.jobOpportunity.findMany({
      where: { isActive: true, isRecoveryFriendly: true },
      orderBy: { postedAt: "desc" },
    }),
    getLastSuccessfulSyncAt(),
  ]);

  const adzunaConfigured = isAdzunaConfigured();
  const lastUpdated = formatLastUpdated(lastSyncAt);

  const jobListings = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    requirements: job.requirements,
    payRange: job.payRange,
    url: job.url,
    source: job.source,
    postedAt: job.postedAt.toISOString(),
    latitude: job.latitude,
    longitude: job.longitude,
  }));

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">
        St. Paul area jobs
      </h1>
      <p className="mt-1 text-sm text-stone-600 md:mt-2 md:max-w-3xl md:text-base">
        Live entry-level listings near zip {JOB_SEARCH_ZIP}, filtered for roles
        that are often a fit for people in recovery who may have a gap in
        employment. Use the map and distance slider to focus on jobs within your
        travel range (default {JOB_DEFAULT_RADIUS_MILES} miles). Tap a card to
        apply on the employer&apos;s site. Ask your program manager before
        applying.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 md:text-sm">
        {lastUpdated ? (
          <span>Last updated {lastUpdated}</span>
        ) : (
          <span>Listings refresh daily once job search is configured.</span>
        )}
        <span>
          Listings are synced within {JOB_SYNC_RADIUS_MILES} miles and filtered
          on this page.
        </span>
      </div>

      {!adzunaConfigured && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Job search API keys are not configured yet. Add{" "}
          <code className="rounded bg-amber-100 px-1">ADZUNA_APP_ID</code> and{" "}
          <code className="rounded bg-amber-100 px-1">ADZUNA_APP_KEY</code> in
          Railway to enable automatic listing updates.
        </div>
      )}

      <div className="mt-6">
        <JobsExplorer jobs={jobListings} />
      </div>
    </div>
  );
}
