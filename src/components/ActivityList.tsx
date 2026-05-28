import { ACTIVITY_COLORS, ACTIVITY_LABELS, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

type Activity = {
  id: string;
  date: Date | string;
  type: string;
  description: string;
  company: string | null;
  roleTitle: string | null;
  hoursSpent: number;
  managerReviewed: boolean;
  managerNotes: string | null;
};

export function ActivityList({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <p className="py-8 text-center text-stone-500">
        No activities logged yet. Start by recording your first job search
        action.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {activities.map((activity) => (
        <li
          key={activity.id}
          className="rounded-2xl border border-stone-200 bg-white p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className={cn(
                  "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                  ACTIVITY_COLORS[activity.type] ?? ACTIVITY_COLORS.OTHER,
                )}
              >
                {ACTIVITY_LABELS[activity.type] ?? activity.type}
              </span>
              <p className="mt-2 text-sm font-medium text-stone-900">
                {activity.description}
              </p>
              {(activity.company || activity.roleTitle) && (
                <p className="mt-1 text-sm text-stone-600">
                  {[activity.roleTitle, activity.company]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right text-xs text-stone-500">
              <div>{formatDate(activity.date)}</div>
              <div className="mt-1">{activity.hoursSpent}h</div>
            </div>
          </div>
          {activity.managerReviewed && activity.managerNotes && (
            <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <span className="font-medium">Manager note: </span>
              {activity.managerNotes}
            </div>
          )}
          {activity.managerReviewed && !activity.managerNotes && (
            <p className="mt-2 text-xs text-emerald-700">Reviewed by manager</p>
          )}
        </li>
      ))}
    </ul>
  );
}
