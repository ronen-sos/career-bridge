type CustomItem = { id: string; label: string };

type DailyUpdateWithCompletions = {
  customCompletions: Array<{
    customItemId: string;
    completed: boolean;
  }>;
};

export type CustomGoalProgress = {
  id: string;
  label: string;
  completed: boolean;
};

export function computeCustomGoalProgress(
  customItems: CustomItem[],
  dailyUpdates: DailyUpdateWithCompletions[],
): CustomGoalProgress[] {
  return customItems.map((item) => ({
    id: item.id,
    label: item.label,
    completed: dailyUpdates.some((update) =>
      update.customCompletions.some(
        (c) => c.customItemId === item.id && c.completed,
      ),
    ),
  }));
}
