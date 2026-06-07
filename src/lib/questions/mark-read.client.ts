export async function markQuestionsAsRead(
  questionIds: string[],
): Promise<{ ok: boolean; marked: number }> {
  if (questionIds.length === 0) {
    return { ok: true, marked: 0 };
  }

  const res = await fetch("/api/questions/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionIds }),
  });

  if (!res.ok) {
    return { ok: false, marked: 0 };
  }

  const data = (await res.json().catch(() => ({}))) as { marked?: number };
  return { ok: true, marked: data.marked ?? 0 };
}
