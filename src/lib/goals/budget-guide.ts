import {
  APPLICATION_UNIT_WEIGHT,
  EMPLOYMENT_HOUR_UNIT_WEIGHT,
  INTERVIEW_UNIT_WEIGHT,
  computeTargetCompositeUnits,
  sumCustomGoalTargetUnits,
} from "@/lib/goals/units";

export type CustomGoalBudgetItem = {
  label: string;
  expectedHours: number;
};

export function formatGoalPeriodBudgetUnits(
  targets: {
    targetApplications: number;
    targetInterviews: number;
    targetEmploymentHours: number;
  },
  customGoals: CustomGoalBudgetItem[] = [],
): number {
  return computeTargetCompositeUnits(targets, customGoals);
}

export function formatGoalPeriodBudgetBreakdown(
  targets: {
    targetApplications: number;
    targetInterviews: number;
    targetEmploymentHours: number;
  },
  customGoals: CustomGoalBudgetItem[] = [],
): string {
  const parts: string[] = [];

  if (targets.targetApplications > 0) {
    parts.push(
      `${targets.targetApplications} application${targets.targetApplications === 1 ? "" : "s"} (${targets.targetApplications * APPLICATION_UNIT_WEIGHT})`,
    );
  }
  if (targets.targetInterviews > 0) {
    parts.push(
      `${targets.targetInterviews} interview${targets.targetInterviews === 1 ? "" : "s"} (${targets.targetInterviews * INTERVIEW_UNIT_WEIGHT})`,
    );
  }
  if (targets.targetEmploymentHours > 0) {
    parts.push(
      `${targets.targetEmploymentHours} employment hr${targets.targetEmploymentHours === 1 ? "" : "s"} (${targets.targetEmploymentHours * EMPLOYMENT_HOUR_UNIT_WEIGHT})`,
    );
  }

  const customUnits = sumCustomGoalTargetUnits(customGoals);
  if (customGoals.length > 0 && customUnits > 0) {
    if (customGoals.length === 1) {
      parts.push(`${customGoals[0]!.label} (${customUnits})`);
    } else {
      parts.push(
        `${customGoals.length} custom goals (${customUnits})`,
      );
    }
  }

  if (parts.length === 0) return "0 units";

  return parts.join(" + ");
}

export function formatCustomGoalsBudgetDetail(
  customGoals: CustomGoalBudgetItem[],
): string {
  if (customGoals.length === 0) return "";

  return customGoals
    .map((item) => `${item.label} (${item.expectedHours} hr${item.expectedHours === 1 ? "" : "s"})`)
    .join(" · ");
}
