import { getWeekStart } from "@/lib/format";
import {
  sumHourTargets,
  sumHourTotals,
  type EmploymentHourTarget,
  type EmploymentHourTotal,
} from "@/lib/goals/hours";

export type GoalProgress = {
  applications: number;
  interviews: number;
  targetApplications: number;
  targetInterviews: number;
  employmentHours: number;
  targetEmploymentHours: number;
  totalHours: number;
  targetTotalHours: number;
};

type DailyUpdate = {
  applicationsCount: number;
  interviewsCount: number;
  employmentHours: number;
};

export function computeGoalProgress(
  goal: {
    targetApplications: number;
    targetInterviews: number;
  } & EmploymentHourTarget,
  updates: DailyUpdate[],
  recordedApplications?: number,
  recordedInterviews?: number,
): GoalProgress {
  const totals = updates.reduce(
    (acc, u) => ({
      applications: acc.applications + u.applicationsCount,
      interviews: acc.interviews + u.interviewsCount,
      employmentHours: acc.employmentHours + u.employmentHours,
    }),
    {
      applications: 0,
      interviews: 0,
      employmentHours: 0,
    },
  );

  const applications = Math.max(
    totals.applications,
    recordedApplications ?? 0,
  );

  const interviews = Math.max(totals.interviews, recordedInterviews ?? 0);

  const hourTargets: EmploymentHourTarget = {
    targetEmploymentHours: goal.targetEmploymentHours,
  };

  const employmentHours = totals.employmentHours;

  return {
    applications,
    interviews,
    employmentHours,
    targetEmploymentHours: hourTargets.targetEmploymentHours,
    totalHours: sumHourTotals({ employmentHours }),
    targetTotalHours: sumHourTargets(hourTargets),
    targetApplications: goal.targetApplications,
    targetInterviews: goal.targetInterviews,
  };
}

export function defaultWeekEnd(weekStart: Date | string): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(0, 0, 0, 0);
  return end;
}

export function getWeekEnd(weekStart: Date): Date {
  const end = defaultWeekEnd(weekStart);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function formatWeekRange(
  weekStart: Date | string,
  weekEnd?: Date | string,
): string {
  const start = new Date(weekStart);
  const end = weekEnd ? new Date(weekEnd) : getWeekEnd(start);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function toDateInputValue(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0]!;
}

export function isDateInWeek(
  date: Date | string,
  weekStart: Date | string,
  weekEnd?: Date | string,
): boolean {
  const d = new Date(date);
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = weekEnd ? new Date(weekEnd) : getWeekEnd(start);
  end.setHours(23, 59, 59, 999);
  d.setHours(12, 0, 0, 0);
  return d >= start && d <= end;
}

export function currentGoalPeriodFilter(date: Date = new Date()) {
  const today = new Date(date);
  today.setHours(12, 0, 0, 0);
  return {
    weekStart: { lte: today },
    weekEnd: { gte: today },
  };
}

export function currentWeekStartInput(): string {
  return toDateInputValue(getWeekStart());
}

export const GOAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Awaiting activation",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

export const GOAL_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-stone-100 text-stone-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-blue-100 text-blue-800",
};

export function formatHourBreakdown(totals: EmploymentHourTotal): string {
  if (totals.employmentHours <= 0) return "";
  return `${totals.employmentHours} employment hrs`;
}
