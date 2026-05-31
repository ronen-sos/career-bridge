import { ExternalLink, MapPin, DollarSign } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { truncate } from "@/lib/jobs/recovery-friendly";

export type JobCardData = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string | null;
  payRange: string | null;
  url: string;
  source: string | null;
  postedAt: Date;
};

export function JobCard({ job }: { job: JobCardData }) {
  const sourceLabel = job.source ?? "Apply";

  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      aria-label={`Apply for ${job.title} at ${job.company}`}
    >
      <Card
        className={cn(
          "flex h-full flex-col transition",
          "group-hover:border-emerald-300 group-hover:shadow-md",
          "group-focus-visible:border-emerald-400",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="group-hover:text-emerald-900">
              {job.title}
            </CardTitle>
            <CardDescription>{job.company}</CardDescription>
          </div>
          <ExternalLink
            className="mt-1 h-4 w-4 shrink-0 text-stone-400 transition group-hover:text-emerald-700"
            aria-hidden
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-sm text-stone-600">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            {job.location}
          </span>
          {job.payRange && (
            <span className="inline-flex items-center gap-1">
              <DollarSign className="h-4 w-4 shrink-0" aria-hidden />
              {job.payRange}
            </span>
          )}
        </div>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-700">
          {truncate(job.description, 220)}
        </p>

        {job.requirements && (
          <p className="mt-2 text-xs text-stone-500">
            {truncate(job.requirements, 120)}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Recovery-friendly
          </span>
          <span className="text-sm font-medium text-emerald-800 group-hover:underline">
            Apply on {sourceLabel} →
          </span>
        </div>
      </Card>
    </a>
  );
}
