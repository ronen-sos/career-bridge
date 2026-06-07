import { serializeActivitiesForFeed } from "@/lib/activities/feed.server";
import { db } from "@/lib/db";
import { hasUnreadManagerReply } from "@/lib/questions/unread";

import type { ActivityFeedItem } from "@/components/ActivityList";

export type MessageLogItem = {
  kind: "message";
  id: string;
  questionId: string;
  direction: "out" | "in";
  preview: string;
  body: string;
  date: string;
  unreadReply: boolean;
  href: string;
};

export type ParticipantLogItem =
  | ({ kind: "activity" } & ActivityFeedItem)
  | MessageLogItem;

function previewText(text: string, max = 120): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export async function buildParticipantLogFeed(
  userId: string,
): Promise<ParticipantLogItem[]> {
  const [activities, questions] = await Promise.all([
    db.jobSearchActivity.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        resumeGeneration: {
          select: {
            id: true,
            positionId: true,
            application: {
              select: { id: true, appliedAt: true },
            },
            position: {
              select: {
                id: true,
                title: true,
                companyId: true,
                company: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
    db.participantQuestion.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activityItems: ParticipantLogItem[] = serializeActivitiesForFeed(
    activities,
  ).map((activity) => ({
    kind: "activity" as const,
    ...activity,
  }));

  const messageItems: MessageLogItem[] = [];

  for (const question of questions) {
    messageItems.push({
      kind: "message",
      id: `question-${question.id}-out`,
      questionId: question.id,
      direction: "out",
      preview: previewText(question.question),
      body: question.question.trim(),
      date: question.createdAt.toISOString(),
      unreadReply: false,
      href: `/dashboard?highlight=${question.id}#manager-messages`,
    });

    if (question.managerReply?.trim()) {
      messageItems.push({
        kind: "message",
        id: `question-${question.id}-in`,
        questionId: question.id,
        direction: "in",
        preview: previewText(question.managerReply),
        body: question.managerReply.trim(),
        date: question.updatedAt.toISOString(),
        unreadReply: hasUnreadManagerReply(question),
        href: `/dashboard?highlight=${question.id}#manager-messages`,
      });
    }
  }

  return [...activityItems, ...messageItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
