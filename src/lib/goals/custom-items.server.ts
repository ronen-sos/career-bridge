import { db } from "@/lib/db";

export type CustomItemInput = {
  id?: string;
  label: string;
};

export async function syncCustomGoalItems(
  weeklyGoalId: string,
  items: CustomItemInput[],
  options: { merge?: boolean } = {},
) {
  if (!options.merge) {
    await db.goalCustomItem.deleteMany({ where: { weeklyGoalId } });

    if (items.length === 0) return;

    await db.goalCustomItem.createMany({
      data: items.map((item, sortOrder) => ({
        weeklyGoalId,
        label: item.label.trim(),
        sortOrder,
      })),
    });
    return;
  }

  const existing = await db.goalCustomItem.findMany({
    where: { weeklyGoalId },
    include: {
      completions: { select: { id: true }, take: 1 },
    },
  });

  const incomingIds = new Set(
    items.map((item) => item.id).filter((id): id is string => !!id),
  );

  for (const item of existing) {
    const stillListed = incomingIds.has(item.id);
    const hasCompletions = item.completions.length > 0;
    if (!stillListed && !hasCompletions) {
      await db.goalCustomItem.delete({ where: { id: item.id } });
    }
  }

  for (let sortOrder = 0; sortOrder < items.length; sortOrder++) {
    const item = items[sortOrder]!;
    const trimmed = item.label.trim();

    if (item.id && existing.some((e) => e.id === item.id)) {
      await db.goalCustomItem.update({
        where: { id: item.id },
        data: { label: trimmed, sortOrder },
      });
    } else {
      await db.goalCustomItem.create({
        data: { weeklyGoalId, label: trimmed, sortOrder },
      });
    }
  }
}

export async function syncCustomCompletions(
  dailyUpdateId: string,
  weeklyGoalId: string,
  completions: Array<{ customItemId: string; completed: boolean }>,
) {
  const validIds = new Set(
    (
      await db.goalCustomItem.findMany({
        where: { weeklyGoalId },
        select: { id: true },
      })
    ).map((item) => item.id),
  );

  await db.goalCustomItemCompletion.deleteMany({
    where: { dailyUpdateId },
  });

  const toCreate = completions.filter(
    (c) => validIds.has(c.customItemId) && c.completed,
  );

  if (toCreate.length === 0) return;

  await db.goalCustomItemCompletion.createMany({
    data: toCreate.map((c) => ({
      customItemId: c.customItemId,
      dailyUpdateId,
      completed: true,
    })),
  });
}
