"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useProgressBridge } from "@/components/goals/ProgressBridgeProvider";
import {
  finishActivityWithProgressCelebration,
  snapshotProgressBeforeActivity,
} from "@/lib/goals/after-activity-progress";
import { computeCustomGoalProgress } from "@/lib/goals/custom-items";

export type CustomGoalItem = {
  id: string;
  label: string;
  expectedHours: number;
};

export type CustomGoalDailyUpdate = {
  customCompletions: Array<{
    customItemId: string;
    completed: boolean;
  }>;
};

export function CustomGoalsChecklistItems({
  goalId,
  customItems,
  dailyUpdates,
}: {
  goalId: string;
  customItems: CustomGoalItem[];
  dailyUpdates: CustomGoalDailyUpdate[];
}) {
  const router = useRouter();
  const progressBridge = useProgressBridge();
  const customProgress = computeCustomGoalProgress(customItems, dailyUpdates);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0]!;

  async function toggleItem(itemId: string, completed: boolean) {
    setLoadingId(itemId);
    snapshotProgressBeforeActivity(progressBridge);

    const res = await fetch(`/api/goals/${goalId}/custom-completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customItemId: itemId,
        completed,
        date: today,
      }),
    });

    if (!res.ok) {
      setLoadingId(null);
      return;
    }

    setLoadingId(null);
    if (completed) {
      await finishActivityWithProgressCelebration(progressBridge, router);
    } else {
      router.refresh();
    }
  }

  return (
    <ul className="space-y-2">
      {customProgress.map((item) => (
        <li key={item.id}>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={item.completed}
              disabled={loadingId === item.id}
              onChange={() => toggleItem(item.id, !item.completed)}
              className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-700"
            />
            <span className="text-sm text-stone-800">
              {item.label}
              <span className="mt-0.5 block text-xs text-stone-500">
                {item.expectedHours} hr{item.expectedHours === 1 ? "" : "s"}
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
