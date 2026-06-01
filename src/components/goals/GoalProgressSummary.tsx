import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import type { GoalProgress } from "@/lib/goals/progress";
import { cn } from "@/lib/cn";

function ProgressRing({
  label,
  current,
  target,
  sublabel,
}: {
  label: string;
  current: number;
  target: number;
  sublabel?: string;
}) {
  const pct =
    target > 0
      ? Math.min(100, Math.round((current / target) * 100))
      : current > 0
        ? 100
        : 0;
  const met = target > 0 && current >= target;

  return (
    <div className="text-center">
      <div className="relative mx-auto h-14 w-14 md:h-16 md:w-16">
        <svg className="h-14 w-14 -rotate-90 md:h-16 md:w-16" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="#e7e5e4"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke={met ? "#047857" : "#059669"}
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-stone-800">
          {pct}%
        </span>
      </div>
      <p className="mt-2 text-xs font-medium text-stone-800">{label}</p>
      <p className="text-xs text-stone-500">
        {sublabel ?? `${current}/${target}`}
      </p>
    </div>
  );
}

export function GoalProgressSummary({
  stats,
  status,
}: {
  stats: GoalProgress;
  status?: string;
}) {
  const countItems = [
    {
      label: "Applications",
      current: stats.applications,
      target: stats.targetApplications,
    },
    {
      label: "Interviews",
      current: stats.interviews,
      target: stats.targetInterviews,
    },
  ];

  const hourItems = [
    {
      label: "Job seeking",
      current: stats.jobSeekingHours,
      target: stats.targetJobSeekingHours,
    },
    {
      label: "Employment",
      current: stats.employmentHours,
      target: stats.targetEmploymentHours,
    },
    {
      label: "Education",
      current: stats.educationHours,
      target: stats.targetEducationHours,
    },
  ];

  const hoursMet = stats.totalHours >= stats.targetTotalHours;
  const hoursPct =
    stats.targetTotalHours > 0
      ? Math.min(100, Math.round((stats.totalHours / stats.targetTotalHours) * 100))
      : 0;

  const allMet =
    countItems.every((item) => item.target === 0 || item.current >= item.target) &&
    hoursMet;

  return (
    <Card>
      <CardTitle>This week&apos;s progress</CardTitle>
      <CardDescription>
        {status === "ACTIVE"
          ? "Daily check-ins count toward these targets."
          : status === "PENDING_APPROVAL"
            ? "Waiting for your manager to approve these goals."
            : status === "DRAFT"
              ? "Set your targets and submit for manager approval."
              : status === "COMPLETED"
                ? allMet
                  ? "Week closed — all targets met."
                  : "Week closed — review results with your manager."
                : "Track applications, interviews, and weekly hours."}
      </CardDescription>

      <div className="mt-4 grid grid-cols-2 gap-3 md:gap-6">
        {countItems.map((item) => (
          <ProgressRing key={item.label} {...item} />
        ))}
      </div>

      <div className="mt-6 border-t border-stone-100 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-stone-900">Weekly hours</p>
            <p className="text-xs text-stone-500">
              {stats.totalHours}/{stats.targetTotalHours} total hrs
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-sm font-semibold",
                hoursMet ? "text-emerald-800" : "text-stone-800",
              )}
            >
              {hoursPct}%
            </p>
            <p className="text-xs text-stone-500">of weekly target</p>
          </div>
        </div>
        <ul className="mt-3 space-y-2">
          {hourItems.map((item) => {
            const met = item.current >= item.target;
            return (
              <li
                key={item.label}
                className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm"
              >
                <span className="text-stone-700">{item.label}</span>
                <span className={cn("font-medium", met ? "text-emerald-800" : "text-stone-800")}>
                  {item.current}/{item.target} hrs
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
