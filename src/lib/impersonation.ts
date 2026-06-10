import { cookies } from "next/headers";

export const IMPERSONATION_COOKIE = "career-path-impersonate";

/**
 * User id from the impersonation cookie, if present. Only trusted when the
 * real (JWT) session role is SUPER_ADMIN — callers must verify that.
 */
export async function getImpersonationTargetId(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(IMPERSONATION_COOKIE)?.value || null;
  } catch {
    // Called outside a request scope (e.g. static generation).
    return null;
  }
}
