"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useProgressBridge } from "@/components/goals/ProgressBridgeProvider";
import {
  finishActivityWithProgressCelebration,
  snapshotProgressBeforeActivity,
} from "@/lib/goals/after-activity-progress";
import { ACTIVITY_COLORS, ACTIVITY_LABELS, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export type ActivityFeedItem = {
  id: string;
  date: Date | string;
  type: string;
  description: string;
  company: string | null;
  roleTitle: string | null;
  hoursSpent: number;
  managerReviewed: boolean;
  managerNotes: string | null;
  resumeGenerationId?: string | null;
  applicationRecorded?: boolean;
  appliedAt?: string | null;
  companyId?: string | null;
  positionId?: string | null;
  companyName?: string | null;
  positionTitle?: string | null;
};

export function ActivityList({
  activities,
  showApplicationActions = false,
}: {
  activities: ActivityFeedItem[];
  showApplicationActions?: boolean;
}) {
  if (activities.length === 0) {
    return (
      <p className="py-8 text-center text-stone-500">
        No activities logged yet. Start by recording your first job search
        action.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {activities.map((activity) => (
        <ActivityListItem
          key={activity.id}
          activity={activity}
          showApplicationActions={showApplicationActions}
        />
      ))}
    </ul>
  );
}

function ActivityListItem({
  activity,
  showApplicationActions,
}: {
  activity: ActivityFeedItem;
  showApplicationActions: boolean;
}) {
  const router = useRouter();
  const progressBridge = useProgressBridge();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(Boolean(activity.applicationRecorded));

  const canMarkApplied =
    showApplicationActions &&
    activity.type === "RESUME" &&
    activity.resumeGenerationId &&
    !applied;

  async function handleMarkApplied() {
    if (!activity.resumeGenerationId) return;

    setLoading(true);
    setError(null);
    snapshotProgressBeforeActivity(progressBridge);

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appliedAt: new Date().toISOString().split("T")[0],
        resumeGenerationId: activity.resumeGenerationId,
        companyId: activity.companyId ?? undefined,
        companyName: activity.companyName ?? activity.company ?? undefined,
        positionId: activity.positionId ?? undefined,
        positionTitle: activity.positionTitle ?? activity.roleTitle ?? undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string"
          ? data.error
          : "Could not record application.",
      );
      setLoading(false);
      return;
    }

    setApplied(true);
    setLoading(false);
    await finishActivityWithProgressCelebration(progressBridge, router);
  }

  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
              ACTIVITY_COLORS[activity.type] ?? ACTIVITY_COLORS.OTHER,
            )}
          >
            {ACTIVITY_LABELS[activity.type] ?? activity.type}
          </span>
          <p className="mt-2 text-sm font-medium text-stone-900">
            {activity.description}
          </p>
          {(activity.company || activity.roleTitle) && (
            <p className="mt-1 text-sm text-stone-600">
              {[activity.roleTitle, activity.company]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {canMarkApplied && (
            <div className="mt-3">
              <Button
                type="button"
                size="sm"
                disabled={loading}
                onClick={handleMarkApplied}
              >
                {loading ? "Saving…" : "Mark application submitted"}
              </Button>
              {error && (
                <p className="mt-2 text-xs text-red-600">{error}</p>
              )}
            </div>
          )}

          {applied && activity.type === "RESUME" && (
            <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Application submitted
              {activity.appliedAt ? ` · ${formatDate(activity.appliedAt)}` : ""}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right text-xs text-stone-500">
          <div>{formatDate(activity.date)}</div>
          {activity.hoursSpent > 0 &&
            activity.type !== "APPLICATION" &&
            activity.type !== "INTERVIEW" && (
            <div className="mt-1">{activity.hoursSpent}h</div>
          )}
        </div>
      </div>
      {activity.managerReviewed && activity.managerNotes && (
        <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <span className="font-medium">Manager note: </span>
          {activity.managerNotes}
        </div>
      )}
      {activity.managerReviewed && !activity.managerNotes && (
        <p className="mt-2 text-xs text-emerald-700">Reviewed by manager</p>
      )}
    </li>
  );
}
