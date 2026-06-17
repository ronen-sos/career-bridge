"use client";

import { useEffect } from "react";
import {
  CheckCircle2,
  Heart,
  PartyPopper,
  Sparkles,
  Trophy,
} from "lucide-react";

import { BridgeScene } from "@/components/goals/BridgeScene";
import {
  useBridgeDisplayProgress,
  useBridgeInlineMessage,
  useBridgeIsWalking,
  useProgressBridge,
} from "@/components/goals/ProgressBridgeProvider";
import { useRegisterVisibleBridge } from "@/components/goals/useRegisterVisibleBridge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import {
  dailyCelebrationMessage,
  hasShownDailyCelebration,
  markDailyCelebrationShown,
} from "@/lib/goals/daily-celebration.client";
import { scrollParticipantBridgeToTop } from "@/lib/goals/bridge-layout";
import { useLocalGoalPace } from "@/lib/goals/local-goal-pace.client";
import type { GoalPace, GoalPaceStatus } from "@/lib/goals/pace";
import { cn } from "@/lib/cn";

const STATUS_CONFIG: Record<
  GoalPaceStatus,
  {
    title: string;
    message: string;
    banner: string;
    icon: typeof CheckCircle2;
  }
> = {
  complete: {
    title: "You reached the end of the path!",
    message: "Every weekly target met — incredible work this week.",
    banner: "bg-emerald-600 text-white",
    icon: Trophy,
  },
  ahead: {
    title: "Ahead of schedule!",
    message: "You're moving faster than expected — amazing momentum.",
    banner: "bg-amber-500 text-white",
    icon: Sparkles,
  },
  on_track: {
    title: "You're on track!",
    message: "Your pace matches the week — steady steps, steady progress.",
    banner: "bg-emerald-500 text-white",
    icon: CheckCircle2,
  },
  behind: {
    title: "You've got this",
    message:
      "Some weeks move slower than others — that's okay. One small step today still moves you forward.",
    banner: "bg-sky-50 text-sky-950 border border-sky-200",
    icon: Heart,
  },
};

export function BridgeProgressCard({
  pace: serverPace,
  weekStart,
  weekEnd,
  weekRange,
  goalId,
}: {
  pace: GoalPace;
  weekStart: string;
  weekEnd: string;
  weekRange: string;
  goalId: string;
}) {
  const pace = useLocalGoalPace(weekStart, weekEnd, serverPace);
  const bridge = useProgressBridge();
  const config = STATUS_CONFIG[pace.status];
  const StatusIcon = config.icon;

  useRegisterVisibleBridge();

  const displayProgress = useBridgeDisplayProgress(goalId, pace.overallProgress);
  const isWalking = useBridgeIsWalking(goalId);
  const inlineMessage = useBridgeInlineMessage();

  useEffect(() => {
    bridge?.syncFromServer({ goalId, weekRange, weekStart, weekEnd, pace });
  }, [
    bridge,
    goalId,
    weekRange,
    weekStart,
    weekEnd,
    pace.overallProgress,
    pace.expectedFraction,
    pace.status,
    pace.weekComplete,
    pace.overallPercent,
    pace.daysElapsed,
    pace.daysTotal,
  ]);

  useEffect(() => {
    if (!pace.celebrateToday) return;
    if (hasShownDailyCelebration(goalId)) return;

    markDailyCelebrationShown(goalId);
    const message = dailyCelebrationMessage(pace.weekComplete);
    void scrollParticipantBridgeToTop();
    bridge?.showCelebrationBanner(message);
  }, [pace.celebrateToday, pace.weekComplete, goalId, bridge]);

  return (
    <>
      <div id="participant-bridge" className="scroll-mt-0">
      <Card className="overflow-hidden p-0">
        <div className="p-4 pb-0">
          <CardTitle>Your path to success</CardTitle>
          <CardDescription>
            <span suppressHydrationWarning>
              {weekRange} · Day {pace.daysElapsed} of {pace.daysTotal} ·{" "}
              {pace.overallPercent}% overall (all goal types)
            </span>
          </CardDescription>
        </div>

        {inlineMessage && (
          <div
            className="mx-4 mt-3 rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md"
            aria-live="polite"
          >
            {inlineMessage}
          </div>
        )}

        <div className="mx-auto mt-3 w-full max-w-2xl">
          <BridgeScene
            overallProgress={displayProgress}
            expectedFraction={pace.expectedFraction}
            status={pace.status}
            weekComplete={pace.weekComplete}
            isWalking={isWalking}
          />
        </div>

        <div className={cn("mx-4 mb-4 mt-2 flex items-start gap-3 rounded-xl px-4 py-3", config.banner)}>
          <StatusIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{config.title}</p>
            <p className="mt-0.5 text-sm opacity-90">{config.message}</p>
            {pace.celebrateToday && (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium">
                <PartyPopper className="h-4 w-4" aria-hidden />
                {dailyCelebrationMessage(pace.weekComplete)}
              </p>
            )}
          </div>
        </div>
      </Card>
      </div>
    </>
  );
}
