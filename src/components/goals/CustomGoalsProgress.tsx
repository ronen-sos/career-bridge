import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { CustomGoalProgress } from "@/lib/goals/custom-items";

export function CustomGoalsProgress({
  items,
}: {
  items: CustomGoalProgress[];
}) {
  if (items.length === 0) return null;

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <Card>
      <CardTitle>Custom goals</CardTitle>
      <CardDescription>
        {completedCount} of {items.length} completed this week
      </CardDescription>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm",
              item.completed
                ? "border-emerald-200 bg-emerald-50"
                : "border-stone-200 bg-white",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold",
                item.completed
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-stone-300 bg-white text-transparent",
              )}
              aria-hidden
            >
              ✓
            </span>
            <span
              className={cn(
                item.completed ? "text-emerald-900" : "text-stone-700",
              )}
            >
              {item.label}
              <span className="mt-0.5 block text-xs text-stone-500">
                {item.expectedHours} hr{item.expectedHours === 1 ? "" : "s"} expected
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
