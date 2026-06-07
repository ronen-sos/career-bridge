import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listResumeHistory } from "@/lib/applications/record.server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const positionId = searchParams.get("positionId");

  if (!positionId) {
    return NextResponse.json(
      { error: "positionId is required" },
      { status: 400 },
    );
  }

  const resumes = await listResumeHistory(session.user.id, positionId);
  return NextResponse.json({
    resumes: resumes.map((resume) => ({
      ...resume,
      createdAt: resume.createdAt.toISOString(),
      application: resume.application
        ? {
            ...resume.application,
            appliedAt: resume.application.appliedAt.toISOString(),
          }
        : null,
    })),
  });
}
