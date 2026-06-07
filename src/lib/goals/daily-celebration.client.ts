export function dailyCelebrationStorageKey(
  goalId: string,
  date: Date = new Date(),
): string {
  return `bridge-daily-celebrate-${goalId}-${date.toISOString().split("T")[0]}`;
}

export function hasShownDailyCelebration(goalId: string): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(dailyCelebrationStorageKey(goalId)) === "1";
}

export function markDailyCelebrationShown(goalId: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(dailyCelebrationStorageKey(goalId), "1");
}

export function dailyCelebrationMessage(weekComplete: boolean): string {
  return weekComplete
    ? "You made it — all weekly targets met!"
    : "You're done for today! Great work.";
}
