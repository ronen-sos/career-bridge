"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { BridgeScene } from "@/components/goals/BridgeScene";
import { ConfettiCelebration } from "@/components/goals/ConfettiCelebration";
import {
  normalizeGoalPaceSnapshot,
  type GoalPaceSnapshot,
} from "@/lib/goals/local-goal-pace.client";
import type { GoalPace } from "@/lib/goals/pace";
import {
  computeGoalPaceStatus,
  hasReachedDailyGoal,
} from "@/lib/goals/pace";
import {
  dailyCelebrationMessage,
  hasShownDailyCelebration,
  markDailyCelebrationShown,
} from "@/lib/goals/daily-celebration.client";
import { easeOutCubic, scrollParticipantBridgeToTop } from "@/lib/goals/bridge-layout";
import { cn } from "@/lib/cn";

const ANIMATION_MS = 2000;
const PROGRESS_EPSILON = 0.0005;
const INLINE_MESSAGE_MS = 8000;
const WALK_PULSE_MS = 2000;

type PaceSnapshot = GoalPaceSnapshot;

type ProgressBridgeContextValue = {
  goalId: string | null;
  displayProgress: number | null;
  displayPace: GoalPace | null;
  isAnimating: boolean;
  inlineBridgeMessage: string | null;
  snapshotProgress: () => void;
  celebrateAfterActivity: () => Promise<boolean>;
  showCelebrationBanner: (message: string, withConfetti?: boolean) => void;
  syncFromServer: (snapshot: PaceSnapshot) => void;
  registerVisibleBridge: () => void;
  unregisterVisibleBridge: () => void;
  hasVisibleBridge: boolean;
};

const ProgressBridgeContext = createContext<ProgressBridgeContextValue | null>(
  null,
);

export function useProgressBridge() {
  return useContext(ProgressBridgeContext);
}

export function useBridgeInlineMessage(): string | null {
  const bridge = useProgressBridge();
  return bridge?.inlineBridgeMessage ?? null;
}

function ProgressBridgeOverlay({
  visible,
  pace,
  displayProgress,
  isWalking,
  message,
}: {
  visible: boolean;
  pace: GoalPace;
  displayProgress: number;
  isWalking: boolean;
  message: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md transition-all duration-500 md:bottom-8 md:max-w-lg",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0",
      )}
      aria-live="polite"
    >
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-xl shadow-emerald-900/10">
        <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-2.5">
          <p className="text-sm font-semibold text-emerald-900">{message}</p>
        </div>
        <BridgeScene
          overallProgress={displayProgress}
          expectedFraction={pace.expectedFraction}
          status={pace.status}
          weekComplete={pace.weekComplete}
          isWalking={isWalking}
          compact
        />
      </div>
    </div>
  );
}

export function ProgressBridgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [goalId, setGoalId] = useState<string | null>(null);
  const [pace, setPace] = useState<GoalPace | null>(null);
  const [displayProgress, setDisplayProgress] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState("Nice step forward!");
  const [inlineBridgeMessage, setInlineBridgeMessage] = useState<string | null>(
    null,
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [topBannerVisible, setTopBannerVisible] = useState(false);
  const [topBannerMessage, setTopBannerMessage] = useState("");

  const settledProgressRef = useRef<number | null>(null);
  const snapshotRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hideOverlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideInlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkPulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleBridgeCountRef = useRef(0);
  const [visibleBridgeCount, setVisibleBridgeCount] = useState(0);

  useEffect(() => {
    visibleBridgeCountRef.current = visibleBridgeCount;
  }, [visibleBridgeCount]);

  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const applyPaceSnapshot = useCallback((snapshot: PaceSnapshot) => {
    const normalized = normalizeGoalPaceSnapshot(snapshot);
    setGoalId(normalized.goalId);
    setPace(normalized.pace);
    settledProgressRef.current = normalized.pace.overallProgress;
    setDisplayProgress(normalized.pace.overallProgress);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/goals/pace")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.pace) return;
        applyPaceSnapshot(data as PaceSnapshot);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [applyPaceSnapshot]);

  useEffect(() => {
    return () => {
      cancelAnimation();
      if (hideOverlayTimerRef.current) clearTimeout(hideOverlayTimerRef.current);
      if (hideBannerTimerRef.current) clearTimeout(hideBannerTimerRef.current);
      if (hideInlineTimerRef.current) clearTimeout(hideInlineTimerRef.current);
      if (walkPulseTimerRef.current) clearTimeout(walkPulseTimerRef.current);
    };
  }, [cancelAnimation]);

  const showBridgeMessage = useCallback((message: string, persistMs?: number) => {
    setInlineBridgeMessage(message);

    if (visibleBridgeCountRef.current === 0) {
      setOverlayMessage(message);
      setOverlayVisible(true);
      if (hideOverlayTimerRef.current) clearTimeout(hideOverlayTimerRef.current);
      hideOverlayTimerRef.current = setTimeout(() => {
        setOverlayVisible(false);
      }, persistMs ?? 4000);
      return;
    }

    if (hideInlineTimerRef.current) clearTimeout(hideInlineTimerRef.current);
    hideInlineTimerRef.current = setTimeout(() => {
      setInlineBridgeMessage(null);
    }, persistMs ?? INLINE_MESSAGE_MS);
  }, []);

  const showCelebrationBanner = useCallback(
    (message: string, withConfetti = true, showInline = true) => {
      setTopBannerMessage(message);
      setTopBannerVisible(true);
      if (withConfetti) {
        setShowConfetti(true);
      }
      if (showInline) {
        showBridgeMessage(message, INLINE_MESSAGE_MS);
      }

      if (hideBannerTimerRef.current) clearTimeout(hideBannerTimerRef.current);
      hideBannerTimerRef.current = setTimeout(() => {
        setTopBannerVisible(false);
      }, 6000);
    },
    [showBridgeMessage],
  );

  const triggerDailyCelebration = useCallback(
    (snapshot: PaceSnapshot) => {
      if (hasShownDailyCelebration(snapshot.goalId)) return false;

      markDailyCelebrationShown(snapshot.goalId);
      const message = dailyCelebrationMessage(snapshot.pace.weekComplete);
      showCelebrationBanner(message);
      return true;
    },
    [showCelebrationBanner],
  );

  const runProgressAnimation = useCallback(
    (from: number, to: number, snapshot: PaceSnapshot, message: string) => {
      cancelAnimation();
      setGoalId(snapshot.goalId);
      setPace(snapshot.pace);
      setIsAnimating(true);
      showBridgeMessage(message, INLINE_MESSAGE_MS);
      setDisplayProgress(from);

      void scrollParticipantBridgeToTop().then(() => {
        const start = performance.now();

        function tick(now: number) {
          const elapsed = now - start;
          const t = Math.min(1, elapsed / ANIMATION_MS);
          const eased = easeOutCubic(t);
          setDisplayProgress(from + (to - from) * eased);

          if (t < 1) {
            animationFrameRef.current = requestAnimationFrame(tick);
            return;
          }

          settledProgressRef.current = to;
          setDisplayProgress(to);
          setIsAnimating(false);
          animationFrameRef.current = null;
        }

        animationFrameRef.current = requestAnimationFrame(tick);
      });
    },
    [cancelAnimation, showBridgeMessage],
  );

  const runWalkPulse = useCallback((snapshot: PaceSnapshot, message: string) => {
    cancelAnimation();
    setGoalId(snapshot.goalId);
    setPace(snapshot.pace);
    setIsAnimating(true);
    showBridgeMessage(message, INLINE_MESSAGE_MS);
    setDisplayProgress(snapshot.pace.overallProgress);
    settledProgressRef.current = snapshot.pace.overallProgress;

    void scrollParticipantBridgeToTop().then(() => {
      if (walkPulseTimerRef.current) clearTimeout(walkPulseTimerRef.current);
      walkPulseTimerRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, WALK_PULSE_MS);
    });
  }, [cancelAnimation, showBridgeMessage]);

  const snapshotProgress = useCallback(() => {
    snapshotRef.current =
      settledProgressRef.current ?? displayProgress ?? snapshotRef.current;
  }, [displayProgress]);

  const celebrateAfterActivity = useCallback(async () => {
    const res = await fetch("/api/goals/pace");
    if (!res.ok) return false;

    const data = (await res.json()) as PaceSnapshot | null;
    if (!data?.pace) return false;

    const snapshot = normalizeGoalPaceSnapshot(data);

    const previous =
      snapshotRef.current ??
      settledProgressRef.current ??
      snapshot.pace.overallProgress;
    const next = snapshot.pace.overallProgress;

    snapshotRef.current = null;

    const previousStatus = computeGoalPaceStatus(
      previous,
      snapshot.pace.expectedFraction,
    );
    const crossedDailyGoal =
      !hasReachedDailyGoal(previousStatus) &&
      hasReachedDailyGoal(snapshot.pace.status);
    const progressIncreased = next > previous + PROGRESS_EPSILON;

    let celebrated = false;
    if (crossedDailyGoal) {
      celebrated = triggerDailyCelebration(snapshot);
    }

    const movementMessage = crossedDailyGoal
      ? dailyCelebrationMessage(snapshot.pace.weekComplete)
      : "You're moving forward!";

    if (progressIncreased) {
      runProgressAnimation(previous, next, snapshot, movementMessage);
      return true;
    }

    if (crossedDailyGoal) {
      runWalkPulse(snapshot, movementMessage);
      applyPaceSnapshot(snapshot);
      return celebrated || true;
    }

    applyPaceSnapshot(snapshot);
    return celebrated;
  }, [
    applyPaceSnapshot,
    runProgressAnimation,
    runWalkPulse,
    triggerDailyCelebration,
  ]);

  const syncFromServer = useCallback(
    (snapshot: PaceSnapshot) => {
      if (isAnimating) return;
      applyPaceSnapshot(snapshot);
      settledProgressRef.current = snapshot.pace.overallProgress;
      setDisplayProgress(snapshot.pace.overallProgress);
    },
    [applyPaceSnapshot, isAnimating],
  );

  const registerVisibleBridge = useCallback(() => {
    setVisibleBridgeCount((count) => count + 1);
  }, []);

  const unregisterVisibleBridge = useCallback(() => {
    setVisibleBridgeCount((count) => Math.max(0, count - 1));
  }, []);

  const hasVisibleBridge = visibleBridgeCount > 0;

  const value: ProgressBridgeContextValue = {
    goalId,
    displayProgress,
    displayPace: pace,
    isAnimating,
    inlineBridgeMessage,
    snapshotProgress,
    celebrateAfterActivity,
    showCelebrationBanner,
    syncFromServer,
    registerVisibleBridge,
    unregisterVisibleBridge,
    hasVisibleBridge,
  };

  return (
    <ProgressBridgeContext.Provider value={value}>
      <ConfettiCelebration
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      <div
        className={cn(
          "pointer-events-none fixed inset-x-4 top-4 z-[60] mx-auto max-w-lg transition-all duration-500 md:top-6",
          topBannerVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0",
        )}
        aria-live="polite"
      >
        <div className="rounded-2xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-900/20">
          {topBannerMessage}
        </div>
      </div>

      {children}
      {pace && displayProgress !== null && !hasVisibleBridge && (
        <ProgressBridgeOverlay
          visible={overlayVisible}
          pace={pace}
          displayProgress={displayProgress}
          isWalking={isAnimating}
          message={overlayMessage}
        />
      )}
    </ProgressBridgeContext.Provider>
  );
}

export function useBridgeDisplayProgress(
  goalId: string,
  serverProgress: number,
): number {
  const bridge = useProgressBridge();

  if (
    bridge?.goalId === goalId &&
    bridge.isAnimating &&
    bridge.displayProgress !== null
  ) {
    return bridge.displayProgress;
  }

  return serverProgress;
}

export function useBridgeIsWalking(goalId: string): boolean {
  const bridge = useProgressBridge();
  return Boolean(bridge?.goalId === goalId && bridge.isAnimating);
}
