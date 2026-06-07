"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";

type Question = {
  id: string;
  question: string;
  managerRead: boolean;
  managerReply: string | null;
  createdAt: string;
};

type ManagerQuestion = Question & {
  user: { id: string; name: string | null; email: string };
};

export function ManagerQuestionList({
  questions,
  showParticipant = true,
  onUpdated,
}: {
  questions: ManagerQuestion[];
  showParticipant?: boolean;
  onUpdated?: () => void;
}) {
  const router = useRouter();
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function submitReview(questionId: string, reply?: string) {
    setLoadingId(questionId);
    await fetch(`/api/questions/${questionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ managerReply: reply }),
    });
    onUpdated?.();
    router.refresh();
    setLoadingId(null);
  }

  if (questions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-stone-500">
        No questions yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {questions.map((q) => (
        <li
          key={q.id}
          className={`rounded-2xl border p-4 ${
            !q.managerRead
              ? "border-amber-200 bg-amber-50"
              : "border-stone-200 bg-white"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              {showParticipant && (
                <p className="font-medium text-stone-900">
                  {q.user.name ?? q.user.email}
                </p>
              )}
              <p className="text-xs text-stone-500">{formatDate(q.createdAt)}</p>
            </div>
            {!q.managerRead ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                New
              </span>
            ) : q.managerReply ? (
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                Replied
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                Read
              </span>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-stone-800">
            {q.question}
          </p>
          {q.managerReply && (
            <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <span className="font-medium">Your reply: </span>
              {q.managerReply}
            </p>
          )}
          {!q.managerReply && (
            <div className="mt-3">
              <textarea
                placeholder="Optional reply for the participant…"
                value={replyDrafts[q.id] ?? ""}
                onChange={(e) =>
                  setReplyDrafts((prev) => ({
                    ...prev,
                    [q.id]: e.target.value,
                  }))
                }
                rows={2}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={loadingId === q.id}
                  onClick={() => submitReview(q.id, replyDrafts[q.id])}
                >
                  {loadingId === q.id
                    ? "Saving…"
                    : replyDrafts[q.id]?.trim()
                      ? "Mark read & reply"
                      : "Mark read"}
                </Button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ManagerQuestionsFeed() {
  const [questions, setQuestions] = useState<ManagerQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  function loadQuestions() {
    setLoading(true);
    fetch("/api/questions")
      .then((r) => r.json())
      .then(setQuestions)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  const unread = questions.filter((q) => !q.managerRead);

  if (loading) {
    return (
      <Card>
        <CardTitle>Participant questions</CardTitle>
        <p className="mt-2 text-sm text-stone-500">Loading…</p>
      </Card>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <Card className={unread.length > 0 ? "border-amber-200 bg-amber-50/40" : undefined}>
      <CardTitle>
        Participant questions
        {unread.length > 0 && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {unread.length} new
          </span>
        )}
      </CardTitle>
      <CardDescription>
        Questions from your participants. Replies are visible on their home page.
      </CardDescription>
      <div className="mt-4">
        <ManagerQuestionList
          questions={questions}
          onUpdated={loadQuestions}
        />
      </div>
    </Card>
  );
}
