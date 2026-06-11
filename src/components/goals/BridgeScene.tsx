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

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <rect x="-2.5" y="-4" width="5" height="16" rx="1.5" fill="#92400e" />
      <circle cx="0" cy="-12" r="11" fill="#059669" />
      <circle cx="-8" cy="-6" r="8" fill="#10b981" />
      <circle cx="8" cy="-7" r="8" fill="#10b981" />
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
        viewBox="0 30 400 122"
        className="w-full"
        role="img"
        aria-label={
          ariaLabel ??
          `Weekly progress ${overallPercent} percent, expected ${expectedPercent} percent`
        }
      >
        <defs>
          <linearGradient id={`pathSky-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky.skyFrom} />
            <stop offset="100%" stopColor={sky.skyTo} />
          </linearGradient>
          <linearGradient id={`pathGrass-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id={`pathTrail-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d6bf94" />
            <stop offset="50%" stopColor="#e7d3ac" />
            <stop offset="100%" stopColor="#d6bf94" />
          </linearGradient>
        </defs>

        <rect width="400" height="180" fill={`url(#pathSky-${uid})`} />

        {sky.showSun && (
          <circle cx="340" cy="56" r="20" fill="#fde047" opacity="0.9" />
        )}

        {sky.showClouds && (
          <>
            <ellipse cx="100" cy="58" rx="32" ry="14" fill="#fff" opacity="0.85" />
            <ellipse cx="130" cy="53" rx="24" ry="11" fill="#fff" opacity="0.7" />
          </>
        )}

        {/* Distant rolling hills */}
        <path
          d="M0,126 Q 90,88 190,122 T 400,118 L400,150 L0,150 Z"
          fill="#bbf7d0"
          opacity="0.85"
        />
        <path
          d="M140,126 Q 260,94 400,122 L400,150 L140,150 Z"
          fill="#a7f3d0"
          opacity="0.8"
        />

        {/* Grass ground */}
        <path
          d="M0,123 C 60,118 130,122 200,120 C 280,118 340,122 400,119 L400,180 L0,180 Z"
          fill={`url(#pathGrass-${uid})`}
        />

        {/* Winding trail */}
        <path
          d="M44,127 C 120,122 230,132 356,125 L356,138 C 230,146 120,135 44,141 Z"
          fill={`url(#pathTrail-${uid})`}
          stroke="#b69b6e"
          strokeWidth="1"
        />
        <line
          x1={BRIDGE_START}
          y1="133"
          x2={BRIDGE_END}
          y2="133"
          stroke="#c2a87d"
          strokeWidth="2"
          strokeDasharray="6 8"
          opacity="0.8"
        />
        <ellipse cx="110" cy="136" rx="3" ry="1.4" fill="#c9b083" />
        <ellipse cx="205" cy="130" rx="2.5" ry="1.2" fill="#c9b083" />
        <ellipse cx="290" cy="135" rx="3" ry="1.4" fill="#c9b083" />

        {/* Trees and flowers along the way */}
        <Tree x={22} y={112} />
        <Tree x={384} y={110} scale={1.1} />
        <circle cx="86" cy="146" r="2.2" fill="#f472b6" />
        <circle cx="92" cy="149" r="1.8" fill="#fbbf24" />
        <circle cx="248" cy="147" r="2.2" fill="#f472b6" />
        <circle cx="318" cy="145" r="1.8" fill="#fbbf24" />
        <circle cx="170" cy="148" r="1.8" fill="#f472b6" />

        {/* Expected-progress marker */}
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

        {/* Goal flag at the end of the path */}
        <g transform={`translate(${BRIDGE_END + 12}, 0)`}>
          <line x1="0" y1="98" x2="0" y2="130" stroke="#78716c" strokeWidth="2.5" />
          {weekComplete ? (
            <>
              <circle cx="0" cy="92" r="13" fill="#fbbf24" />
              <text x="0" y="97" textAnchor="middle" fontSize="13" aria-hidden>
                🏆
              </text>
            </>
          ) : (
            <>
              <polygon points="0,96 22,103 0,110" fill="#f59e0b" />
              <text
                x="4"
                y="124"
                textAnchor="middle"
                fontSize="8"
                fill="#78716c"
                fontWeight="700"
              >
                GOAL
              </text>
            </>
          )}
        </g>

        <Walker x={walkerX} isWalking={isWalking} />

        {/* Distance already traveled */}
        <rect
          x={BRIDGE_START}
          y="128"
          width={overallProgress * BRIDGE_WIDTH}
          height="6"
          fill="#059669"
          rx="3"
          opacity="0.45"
        />
      </svg>

      <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-sm backdrop-blur">
        {overallPercent}% traveled
      </div>
      <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-indigo-700 shadow-sm backdrop-blur">
        {expectedPercent}% expected
      </div>
    </div>
  );
}
