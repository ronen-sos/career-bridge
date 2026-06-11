import { db } from "@/lib/db";
import { getEmailProvider, isEmailConfigured } from "@/lib/email/client";
import { isSuperAdmin, orgScope } from "@/lib/roles";

type ViewerUser = {
  role: string;
  organizationId: string | null;
};

/** Shared by the admin page (server render) and GET /api/users (refreshes). */
export async function getUserAdminData(viewer: ViewerUser) {
  const viewerIsSuperAdmin = isSuperAdmin(viewer.role);

  const [users, organizations] = await Promise.all([
    db.user.findMany({
      where: orgScope(viewer),
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        managerId: true,
        invitedAt: true,
        lastLoginAt: true,
        manager: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    }),
    viewerIsSuperAdmin
      ? db.organization.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return {
    users: users.map((user) => ({
      ...user,
      invitedAt: user.invitedAt?.toISOString() ?? null,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    })),
    emailConfigured: isEmailConfigured(),
    emailProvider: getEmailProvider(),
    viewerIsSuperAdmin,
    viewerOrganizationId: viewer.organizationId ?? null,
    organizations,
  };
}

export type UserAdminData = Awaited<ReturnType<typeof getUserAdminData>>;
