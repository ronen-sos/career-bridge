import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";

/** Session for API routes restricted to the platform super admin. */
export async function requireSuperAdminSession() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    return null;
  }
  return session;
}
