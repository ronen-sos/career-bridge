"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  spin: number;
  shape: "rect" | "circle";
};

const COLORS = [
  "#059669",
  "#10b981",
  "#34d399",
  "#fbbf24",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

function createParticles(count: number, width: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: -10 - Math.random() * 40,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 3 + 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    spin: (Math.random() - 0.5) * 12,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));
}

export function ConfettiCelebration({
  active,
  onComplete,
}: {
  active: boolean;
  onComplete?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    let particles = createParticles(160, window.innerWidth);
    const start = performance.now();
    const duration = 4500;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      particles = particles.filter((p) => p.y < canvas.height + 20);

      if (now - start < duration && particles.length > 0) {
        animationId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
      }
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden
    />
  );
}
