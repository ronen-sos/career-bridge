import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessResume } from "@/lib/resume/access";
import { buildDocxFromMarkdown } from "@/lib/resume/markdown-docx";
import { resumeMarkdownFilename } from "@/lib/resume/markdown";
import {
  daysUntilResumeExpires,
  purgeExpiredResumes,
  resumeRetentionCutoff,
} from "@/lib/resume/retention";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const access = await canAccessResume(
    id,
    session.user.id,
    session.user.role,
  );
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await purgeExpiredResumes(access.userId);

  const resume = await db.resumeGeneration.findFirst({
    where: {
      id,
      userId: access.userId,
      createdAt: { gte: resumeRetentionCutoff() },
    },
    select: {
      id: true,
      targetRole: true,
      targetCompany: true,
      contentMarkdown: true,
      createdAt: true,
    },
  });

  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...resume,
    daysRemaining: daysUntilResumeExpires(resume.createdAt),
  });
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const access = await canAccessResume(
    id,
    session.user.id,
    session.user.role,
  );
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const resume = await db.resumeGeneration.findFirst({
    where: {
      id,
      userId: access.userId,
      createdAt: { gte: resumeRetentionCutoff() },
    },
    select: {
      contentMarkdown: true,
      targetCompany: true,
      createdAt: true,
    },
  });

  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const docxBuffer = await buildDocxFromMarkdown(resume.contentMarkdown);
    const filename = resumeMarkdownFilename(
      resume.targetCompany,
      resume.createdAt,
    );

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Resume export error:", err);
    return NextResponse.json(
      { error: "Could not export resume." },
      { status: 500 },
    );
  }
}
