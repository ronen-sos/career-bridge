import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  findSimilarCompanies,
  searchCompanies,
} from "@/lib/applications/catalog.server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const similarTo = searchParams.get("similarTo");

  if (similarTo) {
    const similar = await findSimilarCompanies(similarTo);
    return NextResponse.json({ similar });
  }

  const companies = await searchCompanies(query);
  return NextResponse.json({ companies });
}
