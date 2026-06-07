import Link from "next/link";
import { Suspense } from "react";

import { requireAuth } from "@/lib/session";
import { ActivityLogForm } from "@/components/ActivityLogForm";
import { ParticipantLogFeed } from "@/components/log/ParticipantLogFeed";
import { InterviewLogForm } from "@/components/interviews/InterviewLogForm";
import { buildParticipantLogFeed } from "@/lib/log/participant-feed.server";
import { Button } from "@/components/ui/Button";
import { BridgeProgressCard } from "@/components/goals/BridgeProgressCard";
import { getParticipantGoalPace } from "@/lib/goals/pace.server";

export default async function AccountabilityPage() {
  const session = await requireAuth();
  const [bridgePace, logItems] = await Promise.all([
    getParticipantGoalPace(session.user.id),
    buildParticipantLogFeed(session.user.id),
  ]);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">Job search log</h1>
      <p className="mt-1 text-sm text-stone-600 md:mt-2 md:text-base">
        Your job search activity and messages with your program manager in one
        timeline.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/accountability#log-interview">
          <Button size="sm">Log interview</Button>
        </Link>
        <Link href="/accountability#log-application">
          <Button size="sm" variant="secondary">
            Log application
          </Button>
        </Link>
      </div>

      {bridgePace && (
        <div className="mt-6">
          <BridgeProgressCard
            goalId={bridgePace.goalId}
            weekRange={bridgePace.weekRange}
            pace={bridgePace.pace}
          />
        </div>
      )}

      <div className="mt-6 space-y-6">
        <div id="log-interview">
          <InterviewLogForm />
        </div>

        <div id="log-application">
          <ActivityLogForm />
        </div>

        <div id="log-history" className="scroll-mt-6">
          <h2 className="mb-3 text-lg font-semibold text-stone-900">
            Your history
          </h2>
          <ParticipantLogFeed items={logItems} showApplicationActions />
        </div>
      </div>
    </div>
  );
}
