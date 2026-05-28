import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { MapPin, DollarSign } from "lucide-react";

export default async function JobsPage() {
  await requireAuth();

  const jobs = await db.jobOpportunity.findMany({
    where: { isActive: true },
    orderBy: { postedAt: "desc" },
  });

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-stone-900">St. Paul area jobs</h1>
      <p className="mt-1 text-sm text-stone-600">
        Curated opportunities in and around St. Paul. Ask your program manager
        before applying.
      </p>

      <div className="mt-6 space-y-3">
        {jobs.length === 0 ? (
          <p className="py-8 text-center text-stone-500">
            No job listings available right now. Check back soon.
          </p>
        ) : (
          jobs.map((job) => (
            <Card key={job.id}>
              <CardTitle>{job.title}</CardTitle>
              <CardDescription>{job.company}</CardDescription>

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-stone-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {job.location}
                </span>
                {job.payRange && (
                  <span className="inline-flex items-center gap-1">
                    <DollarSign className="h-4 w-4" aria-hidden />
                    {job.payRange}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-stone-700">
                {job.description}
              </p>

              {job.requirements && (
                <p className="mt-2 text-xs text-stone-500">
                  Requirements: {job.requirements}
                </p>
              )}

              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-emerald-800 hover:underline"
                >
                  View listing →
                </a>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
