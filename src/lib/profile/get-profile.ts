import { db } from "@/lib/db";

export async function getOrCreateProfile(userId: string) {
  let profile = await db.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await db.profile.create({
      data: { userId },
    });
  }

  const [workExperiences, education, user] = await Promise.all([
    db.workExperience.findMany({
      where: { userId },
      orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
    }),
    db.education.findMany({
      where: { userId },
      orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
  ]);

  return {
    profile,
    workExperiences,
    education,
    user,
  };
}
