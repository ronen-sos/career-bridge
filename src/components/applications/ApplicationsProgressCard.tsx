"use client";

import { CheckCircle2, PartyPopper, Send } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export type ApplicationSummaryItem = {
  id: string;
  appliedAt: string;
  company: { id: string; name: string };
  position: { id: string; title: string };
};

type ApplicationsProgressCardProps = {
  applications: ApplicationSummaryItem[];
  currentCount: number;
  targetCount: number;
  interviewCount?: number;
  interviewTarget?: number;
  status?: string;
};

function celebrationMessage(current: number, target: number): string | null {
  if (target <= 0 || current === 0) return null;
  if (current >= target) {
    return "You hit your application target this week — great work!";
  }
  if (current >= Math.ceil(target * 0.75)) {
    return "You're close to your weekly application goal. Keep going!";
  }
  if (current === 1) {
    return "First application logged this week. Momentum starts here.";
  }
  return null;
}

export function ApplicationsProgressCard({
  applications,
  currentCount,
  targetCount,
  interviewCount = 0,
  interviewTarget = 0,
  status,
}: ApplicationsProgressCardProps) {
  const message = celebrationMessage(currentCount, targetCount);
  const met = targetCount > 0 && currentCount >= targetCount;

  return (
    <Card className={cn(met && "border-emerald-200 bg-emerald-50/40")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>Applications & interviews</CardTitle>
          <CardDescription>
            {status === "ACTIVE"
              ? "Logged activity counts toward this week's goals."
              : "Track where you've applied and which interviews you've had."}
          </CardDescription>
          {interviewTarget > 0 && (
            <p className="mt-2 text-sm text-stone-600">
              {interviewCount} of {interviewTarget} interviews this week
            </p>
          )}
        </div>
        <div
          className={cn(
            "rounded-xl px-3 py-2 text-center",
            met ? "bg-emerald-100" : "bg-stone-100",
          )}
        >
          <p
            className={cn(
              "text-2xl font-bold",
              met ? "text-emerald-900" : "text-stone-900",
            )}
          >
            {currentCount}
          </p>
          <p className="text-xs text-stone-600">of {targetCount} apps</p>
        </div>
      </div>

      {message && (
        <div
          className={cn(
            "mt-4 flex items-start gap-2 rounded-xl px-3 py-3 text-sm",
            met
              ? "bg-emerald-100 text-emerald-950"
              : "bg-amber-50 text-amber-950",
          )}
        >
          {met ? (
            <PartyPopper className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <Send className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{message}</p>
        </div>
      )}

      {applications.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {applications.map((application) => (
            <li
              key={application.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-3"
            >
              <div>
                <p className="font-medium text-stone-900">
                  {application.position.title}
                </p>
                <p className="text-sm text-stone-600">
                  {application.company.name}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-xs text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {formatDate(application.appliedAt)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-stone-500">
          No applications logged yet. Generate a resume or log an application to
          get started.
        </p>
      )}
    </Card>
  );
}
