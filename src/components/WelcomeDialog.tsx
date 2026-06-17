"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  Footprints,
  PartyPopper,
  Users,
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
  persistDismissal,
}: {
  userId: string;
  name: string;
  role: string;
  persistDismissal: boolean;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // When impersonating we never write welcomeSeenAt to the database, so
  // remember the dismissal per browser session or the modal would reopen on
  // every page load and block all clicks behind it.
  const storageKey = `career-path-welcome-dismissed-${userId}`;
  // Always start closed so server HTML matches the first client render.
  // Opening after mount avoids a hydration mismatch that can freeze the page.
  const [open, setOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const features =
    role === "PARTICIPANT" ? PARTICIPANT_FEATURES : TEAM_FEATURES;
  const firstName = name.split(" ")[0] || name;

  useEffect(() => {
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  async function dismiss() {
    setOpen(false);
    setConfetti(false);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Storage unavailable (private mode); the dialog just reopens next load.
    }
    if (persistDismissal) {
      await fetch("/api/welcome", { method: "POST" });
      router.refresh();
    }
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        onClose={dismiss}
        onCancel={dismiss}
        className="m-auto w-[calc(100vw-2rem)] max-w-lg rounded-2xl p-0 shadow-2xl backdrop:bg-stone-950/50"
      >
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-6 py-6 text-white">
          <div className="flex items-center gap-2">
            <PartyPopper className="h-6 w-6 text-amber-300" aria-hidden />
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-200">
              Welcome to Career Path
            </p>
          </div>
          <h2 className="mt-2 text-2xl font-bold leading-tight">
            Great to have you here, {firstName}!
          </h2>
          <p className="mt-1 text-sm text-emerald-100">
            Here&apos;s what you can do in the app:
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
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

          <Button type="button" onClick={dismiss} className="w-full">
            Let&apos;s get started
          </Button>
        </div>

        {open && (
          <ConfettiCelebration
            active={confetti}
            onComplete={() => setConfetti(false)}
          />
        )}
      </dialog>
    </>
  );
}
