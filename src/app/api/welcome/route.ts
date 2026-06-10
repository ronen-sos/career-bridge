import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Mark the signed-in user's first-time welcome as seen. */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { welcomeSeenAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
