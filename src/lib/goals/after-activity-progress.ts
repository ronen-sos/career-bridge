import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type ProgressBridgeActions = {
  snapshotProgress: () => void;
  celebrateAfterActivity: () => Promise<boolean>;
};

export async function finishActivityWithProgressCelebration(
  bridge: ProgressBridgeActions | null | undefined,
  router: AppRouterInstance,
) {
  if (bridge) {
    await bridge.celebrateAfterActivity();
  }

  router.refresh();
}

export function snapshotProgressBeforeActivity(
  bridge: ProgressBridgeActions | null | undefined,
) {
  bridge?.snapshotProgress();
}
