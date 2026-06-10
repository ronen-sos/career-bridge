import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import { isSuperAdmin } from "@/lib/roles";

export async function requireAuth() {
  const session = await auth();
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
