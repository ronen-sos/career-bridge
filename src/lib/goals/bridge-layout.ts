export const BRIDGE_START = 52;
export const BRIDGE_END = 348;
export const BRIDGE_WIDTH = BRIDGE_END - BRIDGE_START;
export const WALKER_Y = 98;

export function progressToWalkerX(progress: number): number {
  return BRIDGE_START + progress * BRIDGE_WIDTH;
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Scroll the in-page bridge to the top of the viewport before walking animations. */
export function scrollParticipantBridgeToTop(): Promise<void> {
  const bridge = document.getElementById("participant-bridge");

  if (bridge) {
    const top = bridge.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return new Promise((resolve) => {
    setTimeout(resolve, 550);
  });
}

/** Scroll settle + walk animation duration — wait before refreshing server data. */
export const BRIDGE_CELEBRATION_MS = 550 + 2000 + 300;
