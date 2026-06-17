"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  Footprints,
  PartyPopper,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { ConfettiCelebration } from "@/components/goals/ConfettiCelebration";
import { Button } from "@/components/ui/Button";

type Feature = { icon: LucideIcon; title: string; description: string };

const PARTICIPANT_FEATURES: Feature[] = [
  {
    icon: ClipboardCheck,
    title: "Log your job search",
    description:
      "Track applications, interviews, networking, and work hours in one place.",
  },
  {
    icon: Footprints,
    title: "Follow your path each week",
    description:
      "Weekly goals show your progress as steps along your path — small wins add up.",
  },
  {
    icon: FileText,
    title: "Build tailored resumes",
    description:
      "Paste a job posting and get a resume customized for that exact role.",
  },
  {
    icon: Users,
    title: "Stay connected",
    description:
      "Your program manager sees your progress, answers questions, and cheers you on.",
  },
  {
    icon: BookOpen,
    title: "Explore career paths",
    description:
      "Guides for trades, warehouse, hospitality, and other opportunities.",
  },
];

const TEAM_FEATURES: Feature[] = [
  {
    icon: Users,
    title: "See your team at a glance",
    description:
      "Participant goals, activity, and questions in one dashboard.",
  },
  {
    icon: ClipboardCheck,
    title: "Set and activate weekly goals",
    description:
      "Create goal periods, review daily updates, and leave encouraging feedback.",
  },
  {
    icon: BookOpen,
    title: "Share career resources",
    description:
      "Point participants to guides for trades, warehouse, hospitality, and more.",
  },
];

export function WelcomeDialog({
  userId,
  name,
  role,
}: {
  userId: string;
  name: string;
  role: string;
}) {
  const router = useRouter();
  const storageKey = `career-path-welcome-dismissed-${userId}`;
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const features =
    role === "PARTICIPANT" ? PARTICIPANT_FEATURES : TEAM_FEATURES;
  const firstName = name.split(" ")[0] || name;

  useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem(storageKey) !== "1") {
        setOpen(true);
        setConfetti(true);
      }
    } catch {
      setOpen(true);
      setConfetti(true);
    }
  }, [storageKey]);

  async function dismiss() {
    if (dismissing) return;
    setDismissing(true);
    setOpen(false);
    setConfetti(false);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Storage unavailable (private mode); the banner reopens next load.
    }
    try {
      await fetch("/api/welcome", { method: "POST" });
    } finally {
      router.refresh();
      setDismissing(false);
    }
  }

  if (!mounted || !open) return null;

  return (
    <>
      <section
        className="relative mx-4 mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-lg md:mx-8 md:mt-6"
        aria-labelledby="welcome-title"
      >
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-5 py-5 text-white sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <PartyPopper className="h-5 w-5 text-amber-300" aria-hidden />
                <p className="text-sm font-medium uppercase tracking-wide text-emerald-200">
                  Welcome to Career Path
                </p>
              </div>
              <h2
                id="welcome-title"
                className="mt-2 text-xl font-bold leading-tight sm:text-2xl"
              >
                Great to have you here, {firstName}!
              </h2>
              <p className="mt-1 text-sm text-emerald-100">
                Here&apos;s what you can do — you can keep using the app while
                you read, then dismiss this when you&apos;re ready.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              disabled={dismissing}
              className="shrink-0 rounded-lg p-1.5 text-emerald-100 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Dismiss welcome"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4 sm:px-6 sm:py-5">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <Icon className="h-4.5 w-4.5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">{title}</p>
                <p className="text-sm text-stone-600">{description}</p>
              </div>
            </div>
          ))}

          <Button
            type="button"
            onClick={dismiss}
            disabled={dismissing}
            className="w-full"
          >
            Let&apos;s get started
          </Button>
        </div>
      </section>

      {confetti && (
        <ConfettiCelebration
          active={confetti}
          onComplete={() => setConfetti(false)}
        />
      )}
    </>
  );
}
