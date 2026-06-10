"use client";

import { useLayoutEffect, useState } from "react";

import type { GoalPace } from "@/lib/goals/pace";
import { adjustGoalPaceForLocalToday } from "@/lib/goals/pace";

export type GoalPaceSnapshot = {
  goalId: string;
  weekRange: string;
  weekStart: string;
  weekEnd: string;
  pace: GoalPace;
};

export function normalizeGoalPaceSnapshot(
  snapshot: GoalPaceSnapshot,
): GoalPaceSnapshot {
  return {
    ...snapshot,
    pace: adjustGoalPaceForLocalToday(
      { weekStart: snapshot.weekStart, weekEnd: snapshot.weekEnd },
      snapshot.pace,
    ),
  };
}

/** Align expected pace with the viewer's local calendar day after hydration. */
export function useLocalGoalPace(
  weekStart: string,
  weekEnd: string,
  serverPace: GoalPace,
): GoalPace {
  const [pace, setPace] = useState(serverPace);

  useLayoutEffect(() => {
    setPace(
      adjustGoalPaceForLocalToday({ weekStart, weekEnd }, serverPace),
    );
  }, [weekStart, weekEnd, serverPace]);

  return pace;
}
