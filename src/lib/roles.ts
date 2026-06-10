export type AppRole = "PARTICIPANT" | "MANAGER" | "ADMIN" | "SUPER_ADMIN";

export function isSuperAdmin(role: string): boolean {
  return role === "SUPER_ADMIN";
}

/** ADMIN or SUPER_ADMIN. */
export function isAdminRole(role: string): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/** MANAGER, ADMIN, or SUPER_ADMIN. */
export function isManagerRole(role: string): boolean {
  return role === "MANAGER" || isAdminRole(role);
}

/**
 * Org filter for queries on User. Super admins see every organization;
 * everyone else is restricted to their own.
 */
export function orgScope(session: {
  role: string;
  organizationId: string | null;
}): { organizationId?: string | null } {
  if (isSuperAdmin(session.role)) return {};
  return { organizationId: session.organizationId };
}
