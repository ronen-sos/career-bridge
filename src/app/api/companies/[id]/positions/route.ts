import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { searchPositions } from "@/lib/applications/catalog.server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  const positions = await searchPositions(id, query);
  return NextResponse.json({ positions });
}
