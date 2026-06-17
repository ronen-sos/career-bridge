"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useProgressBridge } from "@/components/goals/ProgressBridgeProvider";
import {
  finishActivityWithProgressCelebration,
  snapshotProgressBeforeActivity,
} from "@/lib/goals/after-activity-progress";

export type EmploymentHoursLogConfig = {
  goalId: string;
  weekStart: string;
  weekEnd: string;
  existingUpdate?: {
    applicationsCount: number;
    interviewsCount: number;
    employmentHours: number;
  } | null;
};

type EmploymentHoursLogDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: EmploymentHoursLogConfig;
};

export function EmploymentHoursLogDialog({
  open,
  onOpenChange,
  config,
}: EmploymentHoursLogDialogProps) {
  const router = useRouter();
  const progressBridge = useProgressBridge();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0]!;

  function handleClose() {
    if (loading) return;
    onOpenChange(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setLoading(true);
    setError(null);
    snapshotProgressBeforeActivity(progressBridge);

    const form = new FormData(formEl);
    const hours = Number(form.get("employmentHours")) || 0;

    if (hours <= 0) {
      setError("Enter the number of paid work hours for this day.");
      setLoading(false);
      return;
    }

    const payload = {
      date: form.get("date"),
      applicationsCount: config.existingUpdate?.applicationsCount ?? 0,
      interviewsCount: config.existingUpdate?.interviewsCount ?? 0,
      employmentHours: hours,
      notes: `Logged ${hours} paid work hour${hours === 1 ? "" : "s"}.`,
    };

    const res = await fetch(`/api/goals/${config.goalId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (typeof data.error === "string") {
        setError(data.error);
      } else if (data.error?.employmentHours?.[0]) {
        setError(data.error.employmentHours[0]);
      } else if (data.error?.date?.[0]) {
        setError(data.error.date[0]);
      } else {
        setError("Could not save hours.");
      }
      setLoading(false);
      return;
    }

    onOpenChange(false);
    setLoading(false);
    await finishActivityWithProgressCelebration(progressBridge, router);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="employment-hours-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="employment-hours-title"
            className="text-lg font-semibold text-stone-900"
          >
            Log employment hours
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Record paid work hours for a day. Each hour counts as 1 unit toward
            your weekly progress.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="employmentDate"
            className="mb-1 block text-sm font-medium text-stone-700"
          >
            Date
          </label>
          <input
            id="employmentDate"
            name="date"
            type="date"
            defaultValue={today}
            min={config.weekStart}
            max={config.weekEnd}
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
          />
        </div>

        <div>
          <label
            htmlFor="employmentHours"
            className="mb-1 block text-sm font-medium text-stone-700"
          >
            Hours worked
          </label>
          <input
            id="employmentHours"
            name="employmentHours"
            type="number"
            min={0}
            max={24}
            step={0.5}
            defaultValue={config.existingUpdate?.employmentHours ?? ""}
            placeholder="0"
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save hours"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
