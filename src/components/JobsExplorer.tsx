"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { JobCard, type JobCardData } from "@/components/JobCard";
import {
  JOB_DEFAULT_RADIUS_MILES,
  JOB_MAX_RADIUS_MILES,
  JOB_MIN_RADIUS_MILES,
  JOB_RADIUS_STORAGE_KEY,
  JOB_SEARCH_ZIP,
} from "@/lib/jobs/constants";
import {
  distanceFromOriginMiles,
  formatDistanceMiles,
  isWithinRadius,
  sortByDistance,
} from "@/lib/jobs/distance";

const JobsMap = dynamic(
  () => import("@/components/JobsMap").then((mod) => mod.JobsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-stone-200 bg-stone-100 text-sm text-stone-500 md:h-80">
        Loading map…
      </div>
    ),
  },
);

export type JobListing = JobCardData & {
  latitude: number | null;
  longitude: number | null;
};

function readStoredRadius(): number {
  if (typeof window === "undefined") return JOB_DEFAULT_RADIUS_MILES;

  const stored = window.localStorage.getItem(JOB_RADIUS_STORAGE_KEY);
  if (!stored) return JOB_DEFAULT_RADIUS_MILES;

  const parsed = Number(stored);
  if (
    Number.isNaN(parsed) ||
    parsed < JOB_MIN_RADIUS_MILES ||
    parsed > JOB_MAX_RADIUS_MILES
  ) {
    return JOB_DEFAULT_RADIUS_MILES;
  }

  return parsed;
}

export function JobsExplorer({ jobs }: { jobs: JobListing[] }) {
  const [radiusMiles, setRadiusMiles] = useState(JOB_DEFAULT_RADIUS_MILES);

  useEffect(() => {
    setRadiusMiles(readStoredRadius());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(JOB_RADIUS_STORAGE_KEY, String(radiusMiles));
  }, [radiusMiles]);

  const filteredJobs = useMemo(() => {
    const withinRadius = jobs.filter((job) => isWithinRadius(job, radiusMiles));
    return sortByDistance(withinRadius);
  }, [jobs, radiusMiles]);

  const jobsWithDistance = useMemo(
    () =>
      filteredJobs.map((job) => ({
        ...job,
        distanceMiles: distanceFromOriginMiles(job.latitude, job.longitude),
      })),
    [filteredJobs],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="md:max-w-xl">
            <label
              htmlFor="job-radius"
              className="text-sm font-medium text-stone-900"
            >
              Maximum distance from zip {JOB_SEARCH_ZIP}
            </label>
            <p className="mt-1 text-sm text-stone-600">
              Default is {JOB_DEFAULT_RADIUS_MILES} miles. Drag the slider to
              show only jobs within your preferred travel distance.
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-emerald-900">
            {radiusMiles} mi
          </p>
        </div>

        <input
          id="job-radius"
          type="range"
          min={JOB_MIN_RADIUS_MILES}
          max={JOB_MAX_RADIUS_MILES}
          step={1}
          value={radiusMiles}
          onChange={(event) => setRadiusMiles(Number(event.target.value))}
          className="mt-4 h-2 w-full cursor-pointer accent-emerald-700"
          aria-valuemin={JOB_MIN_RADIUS_MILES}
          aria-valuemax={JOB_MAX_RADIUS_MILES}
          aria-valuenow={radiusMiles}
          aria-valuetext={`${radiusMiles} miles from ${JOB_SEARCH_ZIP}`}
        />

        <div className="mt-2 flex justify-between text-xs text-stone-500">
          <span>{JOB_MIN_RADIUS_MILES} mi</span>
          <span>{JOB_MAX_RADIUS_MILES} mi</span>
        </div>
      </section>

      <JobsMap jobs={filteredJobs} radiusMiles={radiusMiles} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          Showing{" "}
          <span className="font-semibold text-stone-900">
            {filteredJobs.length}
          </span>{" "}
          {filteredJobs.length === 1 ? "job" : "jobs"} within {radiusMiles}{" "}
          miles of {JOB_SEARCH_ZIP}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
        {jobsWithDistance.length === 0 ? (
          <p className="col-span-full py-8 text-center text-stone-500">
            No jobs within {radiusMiles} miles of {JOB_SEARCH_ZIP}. Try
            increasing the distance slider.
          </p>
        ) : (
          jobsWithDistance.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              distanceMiles={job.distanceMiles}
            />
          ))
        )}
      </div>
    </div>
  );
}
