import type { CustomGoalProgress } from "@/lib/goals/custom-items";
import type { GoalProgress } from "@/lib/goals/progress";
import { toDateInputValue } from "@/lib/goals/progress";
import {
  computeCompositeProgressFraction,
  isWeekGoalsComplete,
} from "@/lib/goals/units";

export type GoalPaceStatus = "complete" | "ahead" | "on_track" | "behind";

export type GoalPace = {
  daysElapsed: number;
  daysTotal: number;
  expectedFraction: number;
  overallProgress: number;
  overallPercent: number;
  expectedPercent: number;
  status: GoalPaceStatus;
  hasTodayUpdate: boolean;
  dailyGoalMet: boolean;
  celebrateToday: boolean;
  weekComplete: boolean;
};

export function hasReachedDailyGoal(status: GoalPaceStatus): boolean {
  return status === "on_track" || status === "ahead" || status === "complete";
}

export function computeGoalPaceStatus(
  overallProgress: number,
  expectedFraction: number,
): GoalPaceStatus {
  if (overallProgress >= 1) return "complete";
  if (overallProgress >= expectedFraction + 0.05) return "ahead";
  if (overallProgress >= expectedFraction) return "on_track";
  return "behind";
}

function countDaysInPeriod(weekStart: Date, weekEnd: Date): number {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(weekEnd);
  end.setHours(0, 0, 0, 0);
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function countDaysElapsed(
  weekStart: Date,
  weekEnd: Date,
  today: Date = new Date(),
): number {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(weekEnd);
  end.setHours(23, 59, 59, 999);
  const t = new Date(today);
  t.setHours(12, 0, 0, 0);

  if (t < start) return 0;
  if (t > end) return countDaysInPeriod(weekStart, weekEnd);

  return Math.floor((t.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function computeOverallProgress(
  stats: GoalProgress,
  customItems: CustomGoalProgress[] = [],
): number {
  return computeCompositeProgressFraction(
    stats,
    customItems.map((item) => ({
      expectedHours: item.expectedHours,
      completed: item.completed,
    })),
  );
}

export function computeGoalPace(
  period: { weekStart: Date | string; weekEnd: Date | string },
  stats: GoalProgress,
  options: {
    customItems?: CustomGoalProgress[];
    dailyUpdateDates?: Array<Date | string>;
    loggedActivityToday?: boolean;
    today?: Date;
  } = {},
): GoalPace {
  const {
    customItems = [],
    dailyUpdateDates = [],
    loggedActivityToday = false,
    today = new Date(),
  } = options;

  const weekStart = new Date(period.weekStart);
  const weekEnd = new Date(period.weekEnd);
  const daysTotal = countDaysInPeriod(weekStart, weekEnd);
  const daysElapsed = Math.min(
    countDaysElapsed(weekStart, weekEnd, today),
    daysTotal,
  );
  const expectedFraction =
    daysTotal > 0 ? Math.min(1, daysElapsed / daysTotal) : 0;

  const customGoalUnits = customItems.map((item) => ({
    expectedHours: item.expectedHours,
    completed: item.completed,
  }));
  const overallProgress = computeOverallProgress(stats, customItems);
  const weekComplete = isWeekGoalsComplete(stats, customGoalUnits);

  const todayKey = toDateInputValue(today);
  const hasTodayUpdate = dailyUpdateDates.some(
    (date) => toDateInputValue(date) === todayKey,
  );
  const hasTodayActivity = hasTodayUpdate || loggedActivityToday;

  const status = computeGoalPaceStatus(overallProgress, expectedFraction);
  const dailyGoalMet = hasReachedDailyGoal(status);
  const celebrateToday =
    weekComplete || (dailyGoalMet && hasTodayActivity);

  return {
    daysElapsed,
    daysTotal,
    expectedFraction,
    overallProgress,
    overallPercent: Math.round(overallProgress * 100),
    expectedPercent: Math.round(expectedFraction * 100),
    status,
    hasTodayUpdate,
    dailyGoalMet,
    celebrateToday,
    weekComplete,
  };
}
