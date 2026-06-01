import { db } from "@/lib/db";
import { canManageParticipantGoals } from "@/lib/goals/access";

export async function canAccessResume(
  resumeId: string,
  userId: string,
  role: string,
) {
  const resume = await db.resumeGeneration.findUnique({
    where: { id: resumeId },
    select: { userId: true },
  });

  if (!resume) return null;

  if (role === "PARTICIPANT" && resume.userId === userId) {
    return resume;
  }

  const canManage = await canManageParticipantGoals(
    userId,
    role,
    resume.userId,
  );
  return canManage ? resume : null;
}
