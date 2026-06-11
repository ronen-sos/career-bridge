import { cache } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import { isSuperAdmin } from "@/lib/roles";

// Layout and page both check auth during the same render; React's cache()
// dedupes that into a single session resolution per request.
const getSession = cache(() => auth());

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/** Super admin satisfies any role requirement. */
export async function requireRole(roles: string[]) {
  const session = await requireAuth();
  if (
    !roles.includes(session.user.role) &&
    !isSuperAdmin(session.user.role)
  ) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAuth();
  if (!isSuperAdmin(session.user.role)) {
    redirect("/dashboard");
  }
  return session;
}
