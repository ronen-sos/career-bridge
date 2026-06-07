import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { BRIDGE_CELEBRATION_MS } from "@/lib/goals/bridge-layout";

type ProgressBridgeActions = {
  snapshotProgress: () => void;
  celebrateAfterActivity: () => Promise<boolean>;
};

export async function finishActivityWithProgressCelebration(
  bridge: ProgressBridgeActions | null | undefined,
  router: AppRouterInstance,
  options?: { refreshDelayMs?: number },
) {
  const animated = bridge ? await bridge.celebrateAfterActivity() : false;

  if (animated) {
    await new Promise((resolve) =>
      setTimeout(resolve, options?.refreshDelayMs ?? BRIDGE_CELEBRATION_MS),
    );
  }

  router.refresh();
}

export function snapshotProgressBeforeActivity(
  bridge: ProgressBridgeActions | null | undefined,
) {
  bridge?.snapshotProgress();
}
