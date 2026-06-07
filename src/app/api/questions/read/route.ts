import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { markParticipantRepliesRead } from "@/lib/questions/record.server";
import { markQuestionsReadSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "PARTICIPANT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = markQuestionsReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const marked = await markParticipantRepliesRead(
    session.user.id,
    parsed.data.questionIds,
  );

  revalidatePath("/", "layout");
  revalidatePath("/accountability", "page");
  revalidatePath("/dashboard", "page");

  return NextResponse.json({ marked });
}
