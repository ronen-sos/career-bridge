"use client";

import { useEffect } from "react";

import { useProgressBridge } from "@/components/goals/ProgressBridgeProvider";

export function useRegisterVisibleBridge() {
  const bridge = useProgressBridge();

  useEffect(() => {
    if (!bridge) return;
    bridge.registerVisibleBridge();
    return () => bridge.unregisterVisibleBridge();
  }, [bridge]);
}
