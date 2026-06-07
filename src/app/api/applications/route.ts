import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  listRecentApplications,
  recordJobApplication,
} from "@/lib/applications/record.server";
import { jobApplicationSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await listRecentApplications(session.user.id, 20);
  return NextResponse.json({
    applications: applications.map((application) => ({
      ...application,
      appliedAt: application.appliedAt.toISOString(),
      createdAt: application.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = jobApplicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const application = await recordJobApplication({
      userId: session.user.id,
      appliedAt: new Date(parsed.data.appliedAt),
      companyId: parsed.data.companyId,
      companyName: parsed.data.companyName,
      allowSimilarCompanyOverride: parsed.data.allowSimilarCompanyOverride,
      positionId: parsed.data.positionId,
      positionTitle: parsed.data.positionTitle,
      resumeGenerationId: parsed.data.resumeGenerationId,
    });

    return NextResponse.json(
      {
        application: {
          ...application,
          appliedAt: application.appliedAt.toISOString(),
          createdAt: application.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const similar = (err as Error & { similar?: unknown[] }).similar;
    if (similar) {
      return NextResponse.json(
        {
          error: "A similar company name already exists. Select it or confirm adding a new company.",
          similar,
        },
        { status: 409 },
      );
    }

    const message = err instanceof Error ? err.message : "Could not record application.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
