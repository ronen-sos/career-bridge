import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { syncJobs } from "@/lib/jobs/sync-jobs";

function isAuthorizedCron(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;

  return request.headers.get("x-cron-secret") === cronSecret;
}

export async function POST(request: Request) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const isCron = isAuthorizedCron(request);

  if (!isAdmin && !isCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncJobs();
  const status = result.status === "error" ? 500 : 200;

  return NextResponse.json(result, { status });
}
