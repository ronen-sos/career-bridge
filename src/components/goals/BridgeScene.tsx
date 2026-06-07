"use client";

import { useId } from "react";

import type { GoalPaceStatus } from "@/lib/goals/pace";
import {
  BRIDGE_END,
  BRIDGE_START,
  BRIDGE_WIDTH,
  WALKER_Y,
  progressToWalkerX,
} from "@/lib/goals/bridge-layout";

const STATUS_SKY: Record<
  GoalPaceStatus,
  { skyFrom: string; skyTo: string; showSun: boolean; showClouds: boolean }
> = {
  complete: { skyFrom: "#fef9c3", skyTo: "#bbf7d0", showSun: true, showClouds: false },
  ahead: { skyFrom: "#fef3c7", skyTo: "#a7f3d0", showSun: true, showClouds: false },
  on_track: { skyFrom: "#ecfdf5", skyTo: "#bfdbfe", showSun: true, showClouds: false },
  behind: { skyFrom: "#f0f9ff", skyTo: "#dbeafe", showSun: true, showClouds: true },
};

function Walker({ x, isWalking }: { x: number; isWalking: boolean }) {
  const bobValues = isWalking
    ? "0,0; 0,-5; 0,-2; 0,-5; 0,0"
    : "0,0; 0,-3; 0,0";
  const bobDur = isWalking ? "0.45s" : "0.6s";

  return (
    <g transform={`translate(${x}, ${WALKER_Y})`}>
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values={bobValues}
          dur={bobDur}
          repeatCount="indefinite"
        />
        <ellipse cx="0" cy="28" rx="10" ry="3" fill="rgba(0,0,0,0.12)" />
        <circle cx="0" cy="-6" r="7" fill="#fcd34d" stroke="#b45309" strokeWidth="1.2" />
        <rect x="-5" y="2" width="10" height="14" rx="3" fill="#047857" />
        <g>
          {isWalking ? (
            <>
              <line x1="-4" y1="16" x2="-6" y2="26" stroke="#44403c" strokeWidth="2.5" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="-25 -4 16; 20 -4 16; -25 -4 16"
                  dur="0.45s"
                  repeatCount="indefinite"
                />
              </line>
              <line x1="4" y1="16" x2="6" y2="26" stroke="#44403c" strokeWidth="2.5" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="20 4 16; -25 4 16; 20 4 16"
                  dur="0.45s"
                  repeatCount="indefinite"
                />
              </line>
            </>
          ) : (
            <>
              <line x1="-4" y1="16" x2="-6" y2="26" stroke="#44403c" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="4" y1="16" x2="6" y2="26" stroke="#44403c" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
        </g>
        <line x1="-5" y1="8" x2="-12" y2="14" stroke="#44403c" strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="8" x2="12" y2="14" stroke="#44403c" strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
}

export function BridgeScene({
  overallProgress,
  expectedFraction,
  status,
  weekComplete,
  isWalking = false,
  compact = false,
  ariaLabel,
}: {
  overallProgress: number;
  expectedFraction: number;
  status: GoalPaceStatus;
  weekComplete: boolean;
  isWalking?: boolean;
  compact?: boolean;
  ariaLabel?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const sky = STATUS_SKY[status];
  const walkerX = progressToWalkerX(overallProgress);
  const markerX = progressToWalkerX(expectedFraction);
  const overallPercent = Math.round(overallProgress * 100);
  const expectedPercent = Math.round(expectedFraction * 100);

  return (
    <div className="relative">
      <svg
        viewBox="0 0 400 180"
        className="w-full"
        role="img"
        aria-label={
          ariaLabel ??
          `Weekly progress ${overallPercent} percent, expected ${expectedPercent} percent`
        }
      >
        <defs>
          <linearGradient id={`bridgeSky-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky.skyFrom} />
            <stop offset="100%" stopColor={sky.skyTo} />
          </linearGradient>
          <linearGradient id={`bridgeDeck-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#78716c" />
            <stop offset="50%" stopColor="#a8a29e" />
            <stop offset="100%" stopColor="#78716c" />
          </linearGradient>
        </defs>

        <rect width="400" height="180" fill={`url(#bridgeSky-${uid})`} />

        {sky.showSun && (
          <circle cx="340" cy="36" r="22" fill="#fde047" opacity="0.9" />
        )}

        {sky.showClouds && (
          <>
            <ellipse cx="100" cy="44" rx="32" ry="16" fill="#fff" opacity="0.85" />
            <ellipse cx="130" cy="40" rx="24" ry="12" fill="#fff" opacity="0.7" />
          </>
        )}

        <rect x="0" y="118" width="48" height="62" fill="#57534e" rx="4" />
        <rect x="352" y="118" width="48" height="62" fill="#57534e" rx="4" />
        <rect
          x="44"
          y="128"
          width="312"
          height="10"
          fill={`url(#bridgeDeck-${uid})`}
          rx="2"
        />

        {Array.from({ length: 9 }).map((_, i) => (
          <rect
            key={i}
            x={56 + i * 34}
            y="124"
            width="18"
            height="4"
            fill="#44403c"
            rx="1"
          />
        ))}

        <line
          x1={BRIDGE_START}
          y1="110"
          x2={BRIDGE_END}
          y2="110"
          stroke="#a8a29e"
          strokeWidth="2"
          strokeDasharray="4 6"
          opacity="0.7"
        />

        <g transform={`translate(${markerX}, 108)`}>
          <line x1="0" y1="0" x2="0" y2="22" stroke="#6366f1" strokeWidth="2" />
          <polygon points="0,-4 10,4 0,10 -10,4" fill="#6366f1" />
          {!compact && (
            <text
              x="0"
              y="36"
              textAnchor="middle"
              fontSize="9"
              fill="#4338ca"
              fontWeight="600"
            >
              Today
            </text>
          )}
        </g>

        <g transform={`translate(${BRIDGE_END + 8}, 108)`}>
          <circle cx="0" cy="0" r="14" fill={weekComplete ? "#fbbf24" : "#d6d3d1"} />
          {weekComplete ? (
            <text x="0" y="5" textAnchor="middle" fontSize="14" aria-hidden>
              🏆
            </text>
          ) : (
            <text x="0" y="4" textAnchor="middle" fontSize="10" fill="#78716c" fontWeight="700">
              GOAL
            </text>
          )}
        </g>

        <Walker x={walkerX} isWalking={isWalking} />

        <rect
          x={BRIDGE_START}
          y="142"
          width={overallProgress * BRIDGE_WIDTH}
          height="4"
          fill="#059669"
          rx="2"
          opacity="0.5"
        />
      </svg>

      <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-sm backdrop-blur">
        {overallPercent}% crossed
      </div>
      <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-indigo-700 shadow-sm backdrop-blur">
        {expectedPercent}% expected
      </div>
    </div>
  );
}
