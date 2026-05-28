import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

type Stats = {
  applications: number;
  networking: number;
  interviews: number;
  hours: number;
  targetApplications: number;
  targetNetworking: number;
  targetHours: number;
};

export function ProgressSummary({ stats }: { stats: Stats }) {
  const items = [
    {
      label: "Applications",
      current: stats.applications,
      target: stats.targetApplications,
    },
    {
      label: "Networking",
      current: stats.networking,
      target: stats.targetNetworking,
    },
    {
      label: "Hours",
      current: stats.hours,
      target: stats.targetHours,
      isHours: true,
    },
  ];

  return (
    <Card>
      <CardTitle>This week&apos;s progress</CardTitle>
      <CardDescription>
        Track your job search goals for the current week.
      </CardDescription>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {items.map((item) => {
          const pct =
            item.target > 0
              ? Math.min(100, Math.round((item.current / item.target) * 100))
              : 0;
          return (
            <div key={item.label} className="text-center">
              <div className="relative mx-auto h-14 w-14">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
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
                    stroke="#047857"
                    strokeWidth="3"
                    strokeDasharray={`${pct} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-stone-800">
                  {pct}%
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-stone-800">
                {item.label}
              </p>
              <p className="text-xs text-stone-500">
                {item.isHours
                  ? `${item.current}/${item.target}h`
                  : `${item.current}/${item.target}`}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
