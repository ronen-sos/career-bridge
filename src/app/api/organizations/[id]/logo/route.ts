import { NextResponse } from "next/server";

import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const organization = await db.organization.findUnique({
    where: { id },
    select: { logoData: true, logoMimeType: true },
  });

  if (!organization?.logoData || !organization.logoMimeType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(organization.logoData), {
    headers: {
      "Content-Type": organization.logoMimeType,
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
