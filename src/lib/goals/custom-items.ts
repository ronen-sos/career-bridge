type DailyUpdateWithCompletions = {
  customCompletions: Array<{
    customItemId: string;
    completed: boolean;
  }>;
};

export type CustomGoalProgress = {
  id: string;
  label: string;
  expectedHours: number;
  completed: boolean;
};

export function computeCustomGoalProgress(
  customItems: Array<{ id: string; label: string; expectedHours: number }>,
  dailyUpdates: DailyUpdateWithCompletions[],
): CustomGoalProgress[] {
  return customItems.map((item) => ({
    id: item.id,
    label: item.label,
    expectedHours: item.expectedHours,
    completed: dailyUpdates.some((update) =>
      update.customCompletions.some(
        (c) => c.customItemId === item.id && c.completed,
      ),
    ),
  }));
}
