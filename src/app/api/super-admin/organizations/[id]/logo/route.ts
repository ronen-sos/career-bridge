import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireSuperAdminSession } from "@/lib/super-admin/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB

const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
]);

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const existing = await db.organization.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Organization not found." },
      { status: 404 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Choose a logo image to upload." },
      { status: 400 },
    );
  }

  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Logo must be a PNG, JPEG, SVG, or WebP image." },
      { status: 400 },
    );
  }

  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json(
      { error: "Logo must be 1 MB or smaller." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  await db.organization.update({
    where: { id },
    data: {
      logoData: bytes,
      logoMimeType: file.type,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const existing = await db.organization.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Organization not found." },
      { status: 404 },
    );
  }

  await db.organization.update({
    where: { id },
    data: { logoData: null, logoMimeType: null },
  });

  return NextResponse.json({ success: true });
}
