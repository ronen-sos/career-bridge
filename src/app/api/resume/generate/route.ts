import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { logResumeBuiltActivity } from "@/lib/activities/feed.server";
import { resolveCompany, resolvePosition } from "@/lib/applications/catalog.server";
import { getOrCreateProfile } from "@/lib/profile/get-profile";
import { requireContactComplete } from "@/lib/profile/require-contact";
import { generateTailoredResume } from "@/lib/resume/anthropic";
import {
  getResumeDailyUsage,
  recordResumeGeneration,
  RESUME_DAILY_LIMIT,
} from "@/lib/resume/daily-limit";
import { buildResumeDocx } from "@/lib/resume/docx-builder";
import { resumeToMarkdown, resumeMarkdownFilename } from "@/lib/resume/markdown";
import { purgeExpiredResumes } from "@/lib/resume/retention";
import { resumeGenerateSchema } from "@/lib/validations";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = resumeGenerateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const blocked = await requireContactComplete(session.user.id);
  if (blocked) return blocked;

  const { jobDescription, targetRole, targetCompany, companyId, positionId, allowSimilarCompanyOverride } =
    parsed.data;
  const { profile, workExperiences, education, user } =
    await getOrCreateProfile(session.user.id);

  if (workExperiences.length === 0 && education.length === 0) {
    return NextResponse.json(
      {
        error:
          "Add at least one work experience or education entry before generating a resume.",
      },
      { status: 400 },
    );
  }

  const { remainingToday } = await getResumeDailyUsage(session.user.id);
  if (remainingToday <= 0) {
    return NextResponse.json(
      {
        error: `Daily limit reached. You can generate up to ${RESUME_DAILY_LIMIT} resumes per day. Try again tomorrow.`,
      },
      { status: 429 },
    );
  }

  try {
    const company = await resolveCompany({
      companyId,
      companyName: targetCompany,
      allowSimilarOverride: allowSimilarCompanyOverride,
    });

    const position = await resolvePosition({
      companyId: company.id,
      positionId,
      positionTitle: targetRole,
    });

    const tailored = await generateTailoredResume(
      user?.name ?? session.user.name ?? "Candidate",
      profile,
      workExperiences,
      education,
      jobDescription,
      position.title,
      company.name,
    );

    const candidateName = user?.name ?? session.user.name ?? "Candidate";
    const contact = {
      phone: profile.phone,
      email: user?.email,
      location: profile.location,
      linkedInUrl: profile.linkedInUrl,
    };

    const contentMarkdown = resumeToMarkdown(
      candidateName,
      tailored,
      contact,
    );

    await purgeExpiredResumes(session.user.id);

    const saved = await recordResumeGeneration(
      session.user.id,
      contentMarkdown,
      position.title,
      company.name,
      position.id,
    );

    await logResumeBuiltActivity({
      userId: session.user.id,
      resumeGenerationId: saved.id,
      companyName: company.name,
      positionTitle: position.title,
    });

    const docxBuffer = await buildResumeDocx(candidateName, tailored, contact);

    const filename = resumeMarkdownFilename(company.name);

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Resume-Id": saved.id,
        "X-Position-Id": position.id,
        "X-Company-Id": company.id,
      },
    });
  } catch (err) {
    const similar = (err as Error & { similar?: unknown[] }).similar;
    if (similar) {
      return NextResponse.json(
        {
          error:
            "A similar company name already exists. Select it or confirm adding a new company.",
          similar,
        },
        { status: 409 },
      );
    }

    let message =
      err instanceof Error ? err.message : "Resume generation failed";

    if (message.includes("not_found_error") && message.includes("model")) {
      message =
        "The configured AI model is unavailable. Update ANTHROPIC_MODEL to claude-haiku-4-5-20251001 in your environment.";
    }

    console.error("Resume generation error:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
