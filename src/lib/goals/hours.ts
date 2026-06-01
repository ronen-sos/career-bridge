export const MIN_WEEKLY_HOURS = 40;

export const DEFAULT_HOUR_TARGETS = {
  targetJobSeekingHours: 15,
  targetEmploymentHours: 15,
  targetEducationHours: 10,
} as const;

export type HourTargets = {
  targetJobSeekingHours: number;
  targetEmploymentHours: number;
  targetEducationHours: number;
};

export type HourTotals = {
  jobSeekingHours: number;
  employmentHours: number;
  educationHours: number;
};

export function sumHourTargets(targets: HourTargets): number {
  return (
    targets.targetJobSeekingHours +
    targets.targetEmploymentHours +
    targets.targetEducationHours
  );
}

export function sumHourTotals(totals: HourTotals): number {
  return (
    totals.jobSeekingHours + totals.employmentHours + totals.educationHours
  );
}
