import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { getWeekStart } from "@/lib/format";
import { goalInclude } from "@/lib/goals/access";
import { formatWeekRange } from "@/lib/goals/progress";
import { ParticipantGoalsView } from "@/components/goals/GoalsViews";

export default async function GoalsPage() {
  const session = await requireAuth();

  if (session.user.role !== "PARTICIPANT") {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8">
        <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">
          Weekly goals
        </h1>
        <p className="mt-2 text-stone-600">
          Manage participant goals from the Team page.
        </p>
      </div>
    );
  }

  const weekStart = getWeekStart();

  const goal = await db.weeklyGoal.findUnique({
    where: {
      userId_weekStart: {
        userId: session.user.id,
        weekStart,
      },
    },
    include: goalInclude,
  });

  const serializedGoal = goal
    ? {
        ...goal,
        weekStart: goal.weekStart.toISOString(),
        dailyUpdates: goal.dailyUpdates.map((u) => ({
          ...u,
          date: u.date.toISOString(),
          customCompletions: u.customCompletions.map((c) => ({
            customItemId: c.customItemId,
            completed: c.completed,
            customItem: c.customItem,
          })),
        })),
      }
    : null;

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">
        Weekly goals
      </h1>
      <p className="mt-1 text-sm text-stone-600 md:mt-2 md:text-base">
        Set targets with your manager, add custom goals, then check in daily.
      </p>
      <p className="mt-1 text-sm font-medium text-emerald-800">
        {formatWeekRange(weekStart)}
      </p>

      <div className="mt-6">
        <ParticipantGoalsView
          goal={serializedGoal}
          weekStart={weekStart.toISOString().split("T")[0]!}
        />
      </div>
    </div>
  );
}
