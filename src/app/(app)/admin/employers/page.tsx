import Link from "next/link";

import { requireRole } from "@/lib/session";
import { getEmployerInterviewStats } from "@/lib/interviews/record.server";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function AdminEmployersPage() {
  await requireRole(["ADMIN"]);

  const employers = await getEmployerInterviewStats();

  const totals = employers.reduce(
    (acc, row) => ({
      applications: acc.applications + row.applications,
      interviews: acc.interviews + row.interviews,
      linkedInterviews: acc.linkedInterviews + row.linkedInterviews,
      noApplicationInterviews:
        acc.noApplicationInterviews + row.noApplicationInterviews,
    }),
    {
      applications: 0,
      interviews: 0,
      linkedInterviews: 0,
      noApplicationInterviews: 0,
    },
  );

  const overallRate =
    totals.applications > 0
      ? Math.round((totals.linkedInterviews / totals.applications) * 100)
      : null;

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">
            Employer activity
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-600 md:text-base">
            Follow-through rates show how often logged applications lead to
            interviews — useful for guiding future participants toward responsive
            employers.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="secondary" size="sm">
            Back to users
          </Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications logged" value={totals.applications} />
        <StatCard label="Interviews logged" value={totals.interviews} />
        <StatCard
          label="Follow-through rate"
          value={overallRate !== null ? `${overallRate}%` : "—"}
        />
        <StatCard
          label="Interviews without application"
          value={totals.noApplicationInterviews}
        />
      </div>

      <Card className="mt-6">
        <CardTitle>By employer</CardTitle>
        <CardDescription>
          Linked interviews are tied to a logged application at the same company
          and role.
        </CardDescription>

        {employers.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">
            No employer activity yet. Stats appear once participants log
            applications and interviews.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {employers.map((employer) => (
              <div
                key={employer.companyId}
                className="rounded-xl border border-stone-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-stone-900">
                      {employer.companyName}
                    </h2>
                    <p className="mt-1 text-sm text-stone-600">
                      {employer.applications} application
                      {employer.applications === 1 ? "" : "s"} ·{" "}
                      {employer.interviews} interview
                      {employer.interviews === 1 ? "" : "s"}
                      {employer.followThroughRate !== null &&
                        ` · ${employer.followThroughRate}% follow-through`}
                    </p>
                    {employer.noApplicationInterviews > 0 && (
                      <p className="mt-1 text-xs text-stone-500">
                        {employer.noApplicationInterviews} interview
                        {employer.noApplicationInterviews === 1 ? "" : "s"}{" "}
                        logged without a prior application
                      </p>
                    )}
                  </div>
                </div>

                {employer.positions.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                    {employer.positions.map((position) => (
                      <li
                        key={position.positionId}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-stone-700">
                          {position.positionTitle}
                        </span>
                        <span className="shrink-0 text-stone-500">
                          {position.applications} apps · {position.interviews}{" "}
                          interviews
                          {position.followThroughRate !== null &&
                            ` · ${position.followThroughRate}%`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardDescription>{label}</CardDescription>
      <p className="mt-2 text-2xl font-bold text-stone-900">{value}</p>
    </Card>
  );
}
