import { countApplicationsInPeriod } from "@/lib/applications/record.server";
import { db } from "@/lib/db";
import { computeCustomGoalProgress } from "@/lib/goals/custom-items";
import { findCurrentGoalForUser } from "@/lib/goals/access";
import { computeGoalPace } from "@/lib/goals/pace";
import { computeGoalProgress, formatWeekRange } from "@/lib/goals/progress";
import { countInterviewsInPeriod } from "@/lib/interviews/record.server";

export async function getParticipantGoalPace(userId: string) {
  const goal = await findCurrentGoalForUser(userId);
  if (!goal || goal.status !== "ACTIVE") {
    return null;
  }

  const recordedApplications = await countApplicationsInPeriod(
    userId,
    goal.weekStart,
    goal.weekEnd,
  );
  const recordedInterviews = await countInterviewsInPeriod(
    userId,
    goal.weekStart,
    goal.weekEnd,
  );

  const stats = computeGoalProgress(
    goal,
    goal.dailyUpdates,
    recordedApplications,
    recordedInterviews,
  );
  const customProgress = computeCustomGoalProgress(
    goal.customItems,
    goal.dailyUpdates,
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const loggedActivityToday = await db.jobSearchActivity.count({
    where: {
      userId,
      date: { gte: todayStart, lte: todayEnd },
    },
  }).then((count) => count > 0);

  const pace = computeGoalPace(
    { weekStart: goal.weekStart, weekEnd: goal.weekEnd },
    stats,
    {
      customItems: customProgress,
      dailyUpdateDates: goal.dailyUpdates.map((u) => u.date),
      loggedActivityToday,
    },
  );

  return {
    goalId: goal.id,
    weekRange: formatWeekRange(goal.weekStart, goal.weekEnd),
    pace,
  };
}
