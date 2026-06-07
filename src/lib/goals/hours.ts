export const MIN_EMPLOYMENT_HOURS = 15;

export const DEFAULT_EMPLOYMENT_HOURS = 15;

export type EmploymentHourTarget = {
  targetEmploymentHours: number;
};

export type EmploymentHourTotal = {
  employmentHours: number;
};

export function sumHourTargets(targets: EmploymentHourTarget): number {
  return targets.targetEmploymentHours;
}

export function sumHourTotals(totals: EmploymentHourTotal): number {
  return totals.employmentHours;
}

/** @deprecated Use MIN_EMPLOYMENT_HOURS */
export const MIN_WEEKLY_HOURS = MIN_EMPLOYMENT_HOURS;

/** @deprecated Use DEFAULT_EMPLOYMENT_HOURS */
export const DEFAULT_HOUR_TARGETS = {
  targetEmploymentHours: DEFAULT_EMPLOYMENT_HOURS,
} as const;

/** @deprecated Use EmploymentHourTarget */
export type HourTargets = EmploymentHourTarget;

/** @deprecated Use EmploymentHourTotal */
export type HourTotals = EmploymentHourTotal;
