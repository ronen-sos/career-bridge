import { getWeekStart } from "@/lib/format";
import {
  sumHourTargets,
  sumHourTotals,
  type HourTargets,
  type HourTotals,
} from "@/lib/goals/hours";

export type GoalProgress = {
  applications: number;
  interviews: number;
  targetApplications: number;
  targetInterviews: number;
  totalHours: number;
  targetTotalHours: number;
} & HourTotals &
  HourTargets;

type DailyUpdate = {
  applicationsCount: number;
  interviewsCount: number;
} & HourTotals;

export function computeGoalProgress(
  goal: {
    targetApplications: number;
    targetInterviews: number;
  } & HourTargets,
  updates: DailyUpdate[],
): GoalProgress {
  const totals = updates.reduce(
    (acc, u) => ({
      applications: acc.applications + u.applicationsCount,
      interviews: acc.interviews + u.interviewsCount,
      jobSeekingHours: acc.jobSeekingHours + u.jobSeekingHours,
      employmentHours: acc.employmentHours + u.employmentHours,
      educationHours: acc.educationHours + u.educationHours,
    }),
    {
      applications: 0,
      interviews: 0,
      jobSeekingHours: 0,
      employmentHours: 0,
      educationHours: 0,
    },
  );

  const hourTargets: HourTargets = {
    targetJobSeekingHours: goal.targetJobSeekingHours,
    targetEmploymentHours: goal.targetEmploymentHours,
    targetEducationHours: goal.targetEducationHours,
  };

  return {
    applications: totals.applications,
    interviews: totals.interviews,
    jobSeekingHours: totals.jobSeekingHours,
    employmentHours: totals.employmentHours,
    educationHours: totals.educationHours,
    totalHours: sumHourTotals(totals),
    targetTotalHours: sumHourTargets(hourTargets),
    targetApplications: goal.targetApplications,
    targetInterviews: goal.targetInterviews,
    ...hourTargets,
  };
}

export function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function formatWeekRange(weekStart: Date | string): string {
  const start = new Date(weekStart);
  const end = getWeekEnd(start);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function toDateInputValue(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0]!;
}

export function isDateInWeek(date: Date | string, weekStart: Date | string): boolean {
  const d = new Date(date);
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = getWeekEnd(start);
  d.setHours(12, 0, 0, 0);
  return d >= start && d <= end;
}

export function currentWeekStartInput(): string {
  return toDateInputValue(getWeekStart());
}

export const GOAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Awaiting manager approval",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

export const GOAL_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-stone-100 text-stone-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-blue-100 text-blue-800",
};

export function formatHourBreakdown(totals: HourTotals): string {
  const parts: string[] = [];
  if (totals.jobSeekingHours > 0) {
    parts.push(`${totals.jobSeekingHours} job seeking`);
  }
  if (totals.employmentHours > 0) {
    parts.push(`${totals.employmentHours} employment`);
  }
  if (totals.educationHours > 0) {
    parts.push(`${totals.educationHours} education`);
  }
  return parts.join(" · ");
}
