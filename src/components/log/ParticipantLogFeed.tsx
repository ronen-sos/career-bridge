"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useProgressBridge } from "@/components/goals/ProgressBridgeProvider";
import {
  finishActivityWithProgressCelebration,
  snapshotProgressBeforeActivity,
} from "@/lib/goals/after-activity-progress";
import { ACTIVITY_COLORS, ACTIVITY_LABELS, formatDate } from "@/lib/format";
import type { ParticipantLogItem } from "@/lib/log/participant-feed.server";
import { markQuestionsAsRead } from "@/lib/questions/mark-read.client";
import { cn } from "@/lib/cn";

import type { ActivityFeedItem } from "@/components/ActivityList";

function scrollToFirstUnread(
  items: ParticipantLogItem[],
  behavior: ScrollBehavior = "smooth",
) {
  const firstUnread = items.find(
    (item) => item.kind === "message" && item.unreadReply,
  );
  if (!firstUnread) return;

  const el = document.getElementById(`log-item-${firstUnread.id}`);
  el?.scrollIntoView({ behavior, block: "center" });
}

export function ParticipantLogFeed({
  items,
  showApplicationActions = false,
}: {
  items: ParticipantLogItem[];
  showApplicationActions?: boolean;
}) {
  useEffect(() => {
    function tryScroll() {
      if (window.location.hash !== "#unread") return;
      scrollToFirstUnread(items);
    }

    const timeoutId = window.setTimeout(tryScroll, 150);
    window.addEventListener("hashchange", tryScroll);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("hashchange", tryScroll);
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-stone-500">
        Nothing logged yet. Record job search activity or ask your program
        manager a question from Home.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) =>
        item.kind === "message" ? (
          <MessageLogListItem key={item.id} item={item} />
        ) : (
          <ActivityLogListItem
            key={item.id}
            activity={item}
            showApplicationActions={showApplicationActions}
          />
        ),
      )}
    </ul>
  );
}

function MessageLogListItem({
  item,
}: {
  item: Extract<ParticipantLogItem, { kind: "message" }>;
}) {
  const router = useRouter();
  const [isRead, setIsRead] = useState(!item.unreadReply);
  const [expanded, setExpanded] = useState(false);
  const isReply = item.direction === "in";
  const label = isReply ? "Manager reply" : "Message to manager";
  const isUnread = isReply && !isRead;

  useEffect(() => {
    if (!item.unreadReply) {
      setIsRead(true);
    }
  }, [item.unreadReply]);

  async function handleReadUnread() {
    setExpanded(true);
    setIsRead(true);

    const ok = await markQuestionsAsRead([item.questionId]);
    if (!ok) {
      setIsRead(false);
      setExpanded(false);
      return;
    }

    router.refresh();

    if (window.location.hash === "#unread") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  async function handleOpenConversation() {
    if (isReply && !isRead) {
      await handleReadUnread();
    }
    router.push(item.href);
  }

  const cardClass = cn(
    "block rounded-2xl border p-4 transition-colors",
    isUnread
      ? "border-amber-200 bg-amber-50"
      : "border-stone-200 bg-white hover:border-emerald-300",
  );

  const header = (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
              isReply
                ? "bg-emerald-100 text-emerald-800"
                : "bg-sky-100 text-sky-800",
            )}
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            {label}
          </span>
          {isUnread && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              New reply
            </span>
          )}
          {isReply && isRead && (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Read
            </span>
          )}
        </div>
        <p className="mt-2 text-sm font-medium text-stone-900">
          {isReply && !expanded
            ? item.preview
            : isReply
              ? null
              : `You asked: ${item.preview}`}
        </p>
        {isReply && expanded && (
          <p className="mt-2 whitespace-pre-wrap rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {item.body}
          </p>
        )}
        {isUnread && !expanded && (
          <p className="mt-2 text-xs font-medium text-amber-800">
            Tap to read message
          </p>
        )}
        {!isUnread && (
          <p className="mt-2 text-xs font-medium text-emerald-800">
            View full conversation →
          </p>
        )}
      </div>
      <div className="shrink-0 text-right text-xs text-stone-500">
        {formatDate(item.date)}
      </div>
    </div>
  );

  return (
    <li
      id={`log-item-${item.id}`}
      className={cn(isUnread && "scroll-mt-6")}
    >
      {isUnread ? (
        <button
          type="button"
          onClick={handleReadUnread}
          className={cn(cardClass, "w-full text-left")}
        >
          {header}
        </button>
      ) : isReply ? (
        <button
          type="button"
          onClick={handleOpenConversation}
          className={cn(cardClass, "w-full text-left")}
        >
          {header}
        </button>
      ) : (
        <Link href={item.href} className={cardClass}>
          {header}
        </Link>
      )}
    </li>
  );
}

function ActivityLogListItem({
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
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
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
