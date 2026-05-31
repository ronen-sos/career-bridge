import {
  JOB_MAX_DAYS_OLD,
  JOB_SEARCH_QUERIES,
  JOB_SEARCH_ZIP,
  JOB_SYNC_RADIUS_MILES,
} from "@/lib/jobs/constants";

export type AdzunaJob = {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  company?: { display_name?: string };
  location?: {
    display_name?: string;
    area?: string[];
    latitude?: number;
    longitude?: number;
  };
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  category?: { label?: string };
};

type AdzunaSearchResponse = {
  count: number;
  results: AdzunaJob[];
};

export type NormalizedJobListing = {
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  payRange: string | null;
  requirements: string | null;
  postedAt: Date;
  source: string;
  searchQuery: string;
};

function getCredentials() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    return null;
  }

  return { appId, appKey };
}

export function isAdzunaConfigured(): boolean {
  return getCredentials() !== null;
}

export async function searchAdzunaJobs(
  query: string,
  page = 1,
  radiusMiles = JOB_SYNC_RADIUS_MILES,
): Promise<AdzunaJob[]> {
  const credentials = getCredentials();
  if (!credentials) {
    throw new Error("ADZUNA_APP_ID and ADZUNA_APP_KEY are not configured.");
  }

  const params = new URLSearchParams({
    app_id: credentials.appId,
    app_key: credentials.appKey,
    results_per_page: "50",
    what: query,
    where: JOB_SEARCH_ZIP,
    distance: String(radiusMiles),
    max_days_old: String(JOB_MAX_DAYS_OLD),
    sort_by: "date",
    content_type: "application/json",
  });

  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/us/search/${page}?${params.toString()}`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Adzuna search failed (${response.status}) for "${query}": ${body.slice(0, 200)}`,
    );
  }

  const data = (await response.json()) as AdzunaSearchResponse;
  return data.results ?? [];
}

export async function fetchAllTargetedListings(): Promise<
  Array<AdzunaJob & { searchQuery: string }>
> {
  const listings = new Map<string, AdzunaJob & { searchQuery: string }>();

  for (const query of JOB_SEARCH_QUERIES) {
    const results = await searchAdzunaJobs(query);
    for (const job of results) {
      if (!job.id || !job.redirect_url) continue;
      listings.set(String(job.id), { ...job, searchQuery: query });
    }
  }

  return Array.from(listings.values());
}
