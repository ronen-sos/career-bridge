"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export type ParticipantQuestionItem = {
  id: string;
  question: string;
  managerReply: string | null;
  createdAt: string;
  unreadReply: boolean;
};

export function ParticipantMessagesSection({
  questions,
}: {
  questions: ParticipantQuestionItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const sectionRef = useRef<HTMLDivElement>(null);
  const markedIds = useRef(new Set<string>());

  function markRead(ids: string[]) {
    const toMark = ids.filter((id) => !markedIds.current.has(id));
    if (toMark.length === 0) return;
    toMark.forEach((id) => markedIds.current.add(id));
    fetch("/api/questions/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionIds: toMark }),
    }).then(() => router.refresh());
  }

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`question-${highlightId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    markRead(
      questions.filter((q) => q.unreadReply && q.id === highlightId).map((q) => q.id),
    );
  }, [highlightId, questions]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || highlightId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        markRead(questions.filter((q) => q.unreadReply).map((q) => q.id));
      },
      { threshold: 0.25 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [questions, highlightId]);

  if (questions.length === 0) {
    return null;
  }

  const unreadCount = questions.filter((q) => q.unreadReply).length;

  return (
    <div id="manager-messages" ref={sectionRef}>
      <Card className={unreadCount > 0 ? "border-amber-200 bg-amber-50/40" : undefined}>
        <CardTitle>
          Messages with your manager
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              {unreadCount} new
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Questions you&apos;ve sent and replies from your program manager.
        </CardDescription>
        <ul className="mt-4 space-y-3">
          {questions.map((q) => (
            <li
              key={q.id}
              id={`question-${q.id}`}
              className={cn(
                "scroll-mt-24 rounded-2xl border bg-white p-4",
                q.unreadReply
                  ? "border-amber-200 ring-2 ring-amber-100"
                  : highlightId === q.id
                    ? "border-emerald-300 ring-2 ring-emerald-100"
                    : "border-stone-200",
              )}
            >
              <p className="text-xs text-stone-500">{formatDate(q.createdAt)}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-stone-800">
                {q.question}
              </p>
              {q.managerReply ? (
                <div className="mt-3">
                  {q.unreadReply && (
                    <p className="mb-2 text-xs font-medium text-amber-800">
                      New reply from your manager
                    </p>
                  )}
                  <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    <span className="font-medium">Manager: </span>
                    {q.managerReply}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-stone-500">Awaiting response</p>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
