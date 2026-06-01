import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  listSavedResumes,
} from "@/lib/resume/daily-limit";
import {
  daysUntilResumeExpires,
  purgeExpiredResumes,
  RESUME_RETENTION_DAYS,
} from "@/lib/resume/retention";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await purgeExpiredResumes(session.user.id);

  const resumes = await listSavedResumes(session.user.id);

  return NextResponse.json({
    retentionDays: RESUME_RETENTION_DAYS,
    resumes: resumes.map((r) => ({
      ...r,
      daysRemaining: daysUntilResumeExpires(r.createdAt),
    })),
  });
}
