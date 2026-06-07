import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  listApplicationsForInterviewPicker,
  recordJobInterview,
} from "@/lib/interviews/record.server";
import { jobInterviewSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await listApplicationsForInterviewPicker(session.user.id);

  return NextResponse.json({
    applications: applications.map((application) => ({
      id: application.id,
      appliedAt: application.appliedAt.toISOString(),
      company: application.company,
      position: application.position,
      interviews: application.interviews.map((interview) => ({
        id: interview.id,
        interviewedAt: interview.interviewedAt.toISOString(),
      })),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = jobInterviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const interview = await recordJobInterview({
      userId: session.user.id,
      interviewedAt: new Date(parsed.data.interviewedAt),
      linkType: parsed.data.linkType,
      applicationId: parsed.data.applicationId,
      companyId: parsed.data.companyId,
      companyName: parsed.data.companyName,
      allowSimilarCompanyOverride: parsed.data.allowSimilarCompanyOverride,
      positionId: parsed.data.positionId,
      positionTitle: parsed.data.positionTitle,
      appliedAt: parsed.data.appliedAt
        ? new Date(parsed.data.appliedAt)
        : undefined,
      notes: parsed.data.notes,
    });

    return NextResponse.json(
      {
        interview: {
          ...interview,
          interviewedAt: interview.interviewedAt.toISOString(),
          createdAt: interview.createdAt.toISOString(),
          application: interview.application
            ? {
                ...interview.application,
                appliedAt: interview.application.appliedAt.toISOString(),
              }
            : null,
        },
      },
      { status: 201 },
    );
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

    const message =
      err instanceof Error ? err.message : "Could not record interview.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
