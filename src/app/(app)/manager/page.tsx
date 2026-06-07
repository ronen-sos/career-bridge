"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ActivityList } from "@/components/ActivityList";
import { ManagerQuestionsFeed } from "@/components/goals/AskManagerPanel";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  GOAL_STATUS_COLORS,
  GOAL_STATUS_LABELS,
  computeGoalProgress,
} from "@/lib/goals/progress";
import { cn } from "@/lib/cn";

type Participant = {
  id: string;
  name: string;
  email: string;
  activities: Array<{
    id: string;
    date: string;
    type: string;
    description: string;
    company: string | null;
    roleTitle: string | null;
    hoursSpent: number;
    managerReviewed: boolean;
    managerNotes: string | null;
  }>;
};

type ParticipantWithGoal = {
  id: string;
  name: string;
  email: string;
  goal: {
    id: string;
    status: string;
    targetApplications: number;
    targetInterviews: number;
    targetEmploymentHours: number;
    dailyUpdates: Array<{
      applicationsCount: number;
      interviewsCount: number;
      employmentHours: number;
      managerReviewed: boolean;
    }>;
  } | null;
};

export default function ManagerPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [goalsData, setGoalsData] = useState<ParticipantWithGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/activities").then((r) => r.json()),
      fetch("/api/goals").then((r) => r.json()),
    ])
      .then(([activities, goals]) => {
        setParticipants(activities);
        setGoalsData(goals);
      })
      .finally(() => setLoading(false));
  }, []);

  async function markReviewed(activityId: string) {
    await fetch("/api/activities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activityId,
        managerNotes: reviewNotes[activityId] || undefined,
      }),
    });

    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        activities: p.activities.map((a) =>
          a.id === activityId
            ? {
                ...a,
                managerReviewed: true,
                managerNotes: reviewNotes[activityId] || null,
              }
            : a,
        ),
      })),
    );
  }

  if (loading) {
    return (
      <div className="px-4 py-12 text-center text-stone-500">
        Loading team data…
      </div>
    );
  }

  const goalsByParticipant = new Map(goalsData.map((p) => [p.id, p.goal]));

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">Team progress</h1>
      <p className="mt-1 text-sm text-stone-600 md:mt-2 md:text-base">
        Review weekly goals, participant questions, and job search activity.
      </p>

      <div className="mt-6">
        <ManagerQuestionsFeed />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {participants.length === 0 ? (
          <p className="col-span-full text-center text-stone-500">
            No participants assigned yet.
          </p>
        ) : (
          participants.map((participant) => {
            const unreviewed = participant.activities.filter(
              (a) => !a.managerReviewed,
            );
            const goal = goalsByParticipant.get(participant.id);
            const progress = goal
              ? computeGoalProgress(goal, goal.dailyUpdates)
              : null;

            return (
              <Card key={participant.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{participant.name}</CardTitle>
                    <CardDescription>{participant.email}</CardDescription>
                  </div>
                  <Link
                    href={`/manager/participants/${participant.id}`}
                    className="shrink-0 text-sm font-medium text-emerald-800 hover:text-emerald-900"
                  >
                    View profile
                  </Link>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {goal ? (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        GOAL_STATUS_COLORS[goal.status] ?? GOAL_STATUS_COLORS.DRAFT,
                      )}
                    >
                      {GOAL_STATUS_LABELS[goal.status] ?? goal.status}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      No goals this week
                    </span>
                  )}
                  {(goal?.status === "DRAFT" || goal?.status === "PENDING_APPROVAL") && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      Needs activation
                    </span>
                  )}
                </div>

                {progress && goal?.status === "ACTIVE" && (
                  <p className="mt-2 text-xs text-stone-600">
                    {progress.applications}/{progress.targetApplications} apps ·{" "}
                    {progress.interviews}/{progress.targetInterviews} interviews ·{" "}
                    {progress.totalHours}/{progress.targetTotalHours} hrs
                  </p>
                )}

                {unreviewed.length > 0 && (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm font-medium text-amber-800">
                      {unreviewed.length} activit
                      {unreviewed.length === 1 ? "y" : "ies"} awaiting review
                    </p>
                    {unreviewed.map((activity) => (
                      <div
                        key={activity.id}
                        className="rounded-xl border border-amber-200 bg-amber-50 p-3"
                      >
                        <ActivityList activities={[activity]} />
                        <textarea
                          placeholder="Optional feedback for participant…"
                          value={reviewNotes[activity.id] ?? ""}
                          onChange={(e) =>
                            setReviewNotes((prev) => ({
                              ...prev,
                              [activity.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        />
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => markReviewed(activity.id)}
                        >
                          Mark reviewed
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-medium text-stone-700">
                    Recent activity
                  </h3>
                  <ActivityList
                    activities={participant.activities.filter(
                      (a) => a.managerReviewed,
                    )}
                  />
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
