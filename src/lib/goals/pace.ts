import type { CustomGoalProgress } from "@/lib/goals/custom-items";
import type { GoalProgress } from "@/lib/goals/progress";
import {
  countCalendarDaysInclusive,
  countDaysElapsedInPeriod,
  parseCalendarDate,
  todayInLocalCalendar,
  toDateInputValue,
} from "@/lib/goals/dates";
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

function countDaysInPeriod(weekStart: Date | string, weekEnd: Date | string): number {
  return countCalendarDaysInclusive(weekStart, weekEnd);
}

function countDaysElapsed(
  weekStart: Date | string,
  weekEnd: Date | string,
  today: Date = new Date(),
): number {
  return countDaysElapsedInPeriod(weekStart, weekEnd, today);
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

  const weekStart = parseCalendarDate(period.weekStart);
  const weekEnd = parseCalendarDate(period.weekEnd);
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

/** Recompute day-based pace fields using the viewer's local calendar day. */
export function adjustGoalPaceForLocalToday(
  period: { weekStart: Date | string; weekEnd: Date | string },
  pace: GoalPace,
  today: Date = todayInLocalCalendar(),
): GoalPace {
  const weekStart = parseCalendarDate(period.weekStart);
  const weekEnd = parseCalendarDate(period.weekEnd);
  const daysTotal = countCalendarDaysInclusive(weekStart, weekEnd);
  const daysElapsed = Math.min(
    countDaysElapsedInPeriod(weekStart, weekEnd, today),
    daysTotal,
  );
  const expectedFraction =
    daysTotal > 0 ? Math.min(1, daysElapsed / daysTotal) : 0;
  const status = computeGoalPaceStatus(pace.overallProgress, expectedFraction);
  const dailyGoalMet = hasReachedDailyGoal(status);

  return {
    ...pace,
    daysElapsed,
    daysTotal,
    expectedFraction,
    expectedPercent: Math.round(expectedFraction * 100),
    status,
    dailyGoalMet,
    celebrateToday:
      pace.weekComplete || (dailyGoalMet && pace.hasTodayUpdate),
  };
}
