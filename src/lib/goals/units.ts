import type { GoalProgress } from "@/lib/goals/progress";

/** One application counts as half a progress unit. */
export const APPLICATION_UNIT_WEIGHT = 0.5;

/** One interview counts as one progress unit. */
export const INTERVIEW_UNIT_WEIGHT = 1;

/** One paid employment hour counts as one progress unit. */
export const EMPLOYMENT_HOUR_UNIT_WEIGHT = 1;

export type CustomGoalUnits = {
  expectedHours: number;
  completed: boolean;
};

type GoalCounts = Pick<
  GoalProgress,
  | "applications"
  | "interviews"
  | "employmentHours"
  | "targetApplications"
  | "targetInterviews"
  | "targetEmploymentHours"
>;

export function applicationUnits(count: number): number {
  return count * APPLICATION_UNIT_WEIGHT;
}

export function sumCustomGoalTargetUnits(
  customGoals: Array<Pick<CustomGoalUnits, "expectedHours">>,
): number {
  return customGoals.reduce((sum, item) => sum + item.expectedHours, 0);
}

export function sumCustomGoalCompletedUnits(
  customGoals: CustomGoalUnits[],
): number {
  return customGoals
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.expectedHours, 0);
}

export function computeTargetCompositeUnits(
  stats: Pick<
    GoalProgress,
    "targetApplications" | "targetInterviews" | "targetEmploymentHours"
  >,
  customGoals: Array<Pick<CustomGoalUnits, "expectedHours">> = [],
): number {
  let total = 0;

  if (stats.targetApplications > 0) {
    total += applicationUnits(stats.targetApplications);
  }
  if (stats.targetInterviews > 0) {
    total += stats.targetInterviews * INTERVIEW_UNIT_WEIGHT;
  }
  if (stats.targetEmploymentHours > 0) {
    total += stats.targetEmploymentHours * EMPLOYMENT_HOUR_UNIT_WEIGHT;
  }

  total += sumCustomGoalTargetUnits(customGoals);

  return total;
}

export function computeCompletedCompositeUnits(
  stats: GoalCounts,
  customGoals: CustomGoalUnits[] = [],
): number {
  let total = 0;

  if (stats.targetApplications > 0) {
    total += applicationUnits(
      Math.min(stats.applications, stats.targetApplications),
    );
  }
  if (stats.targetInterviews > 0) {
    total += Math.min(stats.interviews, stats.targetInterviews) *
      INTERVIEW_UNIT_WEIGHT;
  }
  if (stats.targetEmploymentHours > 0) {
    total += Math.min(stats.employmentHours, stats.targetEmploymentHours) *
      EMPLOYMENT_HOUR_UNIT_WEIGHT;
  }

  total += sumCustomGoalCompletedUnits(customGoals);

  return total;
}

/** Capped 0–1 progress per goal type. Extra apps/interviews do not count past target. */
export function computeCategoryProgressRatios(
  stats: GoalCounts,
  customGoals: CustomGoalUnits[] = [],
): number[] {
  const ratios: number[] = [];

  if (stats.targetApplications > 0) {
    ratios.push(
      Math.min(1, stats.applications / stats.targetApplications),
    );
  }
  if (stats.targetInterviews > 0) {
    ratios.push(Math.min(1, stats.interviews / stats.targetInterviews));
  }
  if (stats.targetEmploymentHours > 0) {
    ratios.push(
      Math.min(1, stats.employmentHours / stats.targetEmploymentHours),
    );
  }

  if (customGoals.length > 0) {
    const completed = customGoals.filter((item) => item.completed).length;
    ratios.push(completed / customGoals.length);
  }

  return ratios;
}

/**
 * Weekly goal progress: average of each goal type's capped completion.
 * Categories do not substitute for one another (extra interviews won't
 * offset missing applications).
 */
export function computeCompositeProgressFraction(
  stats: GoalProgress,
  customGoals: CustomGoalUnits[] = [],
): number {
  const ratios = computeCategoryProgressRatios(stats, customGoals);
  if (ratios.length === 0) return 0;

  return ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
}

/** True only when every set weekly target is fully met (no category may be skipped). */
export function isWeekGoalsComplete(
  stats: GoalCounts,
  customGoals: CustomGoalUnits[] = [],
): boolean {
  const ratios = computeCategoryProgressRatios(stats, customGoals);
  if (ratios.length === 0) return false;
  return ratios.every((ratio) => ratio >= 1);
}
