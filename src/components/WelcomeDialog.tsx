"use client";

import { useEffect, useRef, useState } from "react";
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
    title: "Cross the bridge each week",
    description:
      "Weekly goals show your progress as steps across a bridge — small wins add up.",
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
  name,
  role,
  persistDismissal,
}: {
  name: string;
  role: string;
  persistDismissal: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(true);
  const [confetti, setConfetti] = useState(true);

  const features =
    role === "PARTICIPANT" ? PARTICIPANT_FEATURES : TEAM_FEATURES;
  const firstName = name.split(" ")[0] || name;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  function dismiss() {
    setOpen(false);
    if (persistDismissal) {
      void fetch("/api/welcome", { method: "POST" });
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

        {/* Inside the dialog so it paints above the top-layer backdrop. */}
        <ConfettiCelebration
          active={confetti}
          onComplete={() => setConfetti(false)}
        />
      </dialog>
    </>
  );
}
