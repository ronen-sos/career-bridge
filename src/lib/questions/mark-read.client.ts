export async function markQuestionsAsRead(questionIds: string[]): Promise<boolean> {
  if (questionIds.length === 0) return true;

  const res = await fetch("/api/questions/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionIds }),
  });

  return res.ok;
}
