"use client";

import { useEffect, useState } from "react";

import { ActivityList } from "@/components/ActivityList";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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

export default function ManagerPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/activities")
      .then((r) => r.json())
      .then(setParticipants)
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

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-stone-900">Team progress</h1>
      <p className="mt-1 text-sm text-stone-600">
        Review participant job search activity and leave feedback.
      </p>

      <div className="mt-6 space-y-6">
        {participants.length === 0 ? (
          <p className="text-center text-stone-500">
            No participants assigned yet.
          </p>
        ) : (
          participants.map((participant) => {
            const unreviewed = participant.activities.filter(
              (a) => !a.managerReviewed,
            );

            return (
              <Card key={participant.id}>
                <CardTitle>{participant.name}</CardTitle>
                <CardDescription>{participant.email}</CardDescription>

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
