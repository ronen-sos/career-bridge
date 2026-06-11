import { DesktopNav } from "@/components/DesktopNav";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { MobileNav } from "@/components/MobileNav";
import { Providers } from "@/components/Providers";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { db } from "@/lib/db";
import { countUnreadRepliesForParticipant } from "@/lib/questions/record.server";
import { requireAuth } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  const [logBadgeCount, organization, welcomeUser] = await Promise.all([
    session.user.role === "PARTICIPANT"
      ? countUnreadRepliesForParticipant(session.user.id)
      : 0,
    session.user.organizationId
      ? db.organization.findUnique({
          where: { id: session.user.organizationId },
          select: { id: true, name: true, logoMimeType: true, updatedAt: true },
        })
      : null,
    db.user.findUnique({
      where: { id: session.user.id },
      select: { welcomeSeenAt: true },
    }),
  ]);

  const showWelcome = welcomeUser?.welcomeSeenAt == null;

  const orgBranding = organization
    ? {
        id: organization.id,
        name: organization.name,
        hasLogo: Boolean(organization.logoMimeType),
        logoVersion: organization.updatedAt.toISOString(),
      }
    : null;

  return (
    <Providers session={session} logBadgeCount={logBadgeCount}>
      {session?.user && (
        <DesktopNav
          role={session.user.role}
          logBadgeCount={logBadgeCount}
          organization={orgBranding}
        />
      )}
      <div className="min-h-dvh bg-stone-50 pb-24 md:pl-64 md:pb-8">
        {session.user.impersonatedBy && (
          <ImpersonationBanner
            userName={session.user.name ?? "this user"}
            superAdminEmail={session.user.impersonatedBy}
          />
        )}
        <div className="mx-auto w-full max-w-lg md:max-w-4xl lg:max-w-6xl">
          {children}
        </div>
        {showWelcome && (
          <WelcomeDialog
            name={session.user.name ?? "there"}
            role={session.user.role}
            persistDismissal={!session.user.impersonatedBy}
          />
        )}
        {session?.user && (
          <MobileNav role={session.user.role} logBadgeCount={logBadgeCount} />
        )}
      </div>
    </Providers>
  );
}
