import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  CONTACT_REQUIRED_MESSAGE,
  isContactComplete,
} from "@/lib/profile/contact-complete";

export async function getProfileContactComplete(
  userId: string,
): Promise<boolean> {
  const profile = await db.profile.findUnique({ where: { userId } });
  return isContactComplete(profile);
}

export async function requireContactComplete(userId: string) {
  const complete = await getProfileContactComplete(userId);
  if (!complete) {
    return NextResponse.json({ error: CONTACT_REQUIRED_MESSAGE }, { status: 403 });
  }
  return null;
}
