"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  CustomGoalsChecklistItems,
  type CustomGoalDailyUpdate,
  type CustomGoalItem,
} from "@/components/goals/CustomGoalsChecklistItems";
import { computeCustomGoalProgress } from "@/lib/goals/custom-items";

export type CustomGoalsLogConfig = {
  goalId: string;
  customItems: CustomGoalItem[];
  dailyUpdates: CustomGoalDailyUpdate[];
};

type CustomGoalsLogDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CustomGoalsLogConfig;
};

export function CustomGoalsLogDialog({
  open,
  onOpenChange,
  config,
}: CustomGoalsLogDialogProps) {
  function handleClose() {
    onOpenChange(false);
  }

  const completedCount = computeCustomGoalProgress(
    config.customItems,
    config.dailyUpdates,
  ).filter((item) => item.completed).length;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="custom-goals-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="custom-goals-title" className="text-lg font-semibold text-stone-900">
            Custom goals this week
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Check off goals as you complete them. Each counts toward your weekly
            progress.
          </p>
          {config.customItems.length > 0 && (
            <p className="mt-1 text-xs text-stone-500">
              {completedCount} of {config.customItems.length} done
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5">
        <CustomGoalsChecklistItems
          goalId={config.goalId}
          customItems={config.customItems}
          dailyUpdates={config.dailyUpdates}
        />
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="button" variant="secondary" onClick={handleClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
