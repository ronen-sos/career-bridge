"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    onOpenChange(false);
  }

  const completedCount = computeCustomGoalProgress(
    config.customItems,
    config.dailyUpdates,
  ).filter((item) => item.completed).length;

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-4 backdrop:bg-stone-900/50 open:flex open:items-end open:justify-center sm:open:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              Custom goals this week
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Check off goals as you complete them. Each counts toward your
              weekly progress.
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
      </div>
    </dialog>
  );
}
