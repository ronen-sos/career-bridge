import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import type { GoalProgress } from "@/lib/goals/progress";

export function ProgressRing({
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
  const items = [
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
    {
      label: "Employment hrs",
      current: stats.employmentHours,
      target: stats.targetEmploymentHours,
      sublabel: `${stats.employmentHours}/${stats.targetEmploymentHours} hrs`,
    },
  ];

  const allMet = items.every(
    (item) => item.target === 0 || item.current >= item.target,
  );

  return (
    <Card>
      <CardTitle>This week&apos;s progress</CardTitle>
      <CardDescription>
        {status === "ACTIVE"
          ? "Each goal type counts separately—going over on one does not replace another."
          : status === "PENDING_APPROVAL"
            ? "Waiting for your manager to approve these goals."
            : status === "DRAFT"
              ? "Set targets and submit for manager approval."
              : status === "COMPLETED"
                ? allMet
                  ? "Week closed — all targets met."
                  : "Week closed — review results with your manager."
                : "Track applications, interviews, and employment hours."}
      </CardDescription>

      <div className="mt-4 grid grid-cols-3 gap-3 md:gap-6">
        {items.map((item) => (
          <ProgressRing key={item.label} {...item} />
        ))}
      </div>
    </Card>
  );
}
