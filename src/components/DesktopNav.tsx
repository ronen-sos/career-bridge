"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { getNavLinks } from "@/lib/nav-links";
import { useUnreadReplies } from "@/lib/questions/unread-replies.client";

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export type OrgBranding = {
  id: string;
  name: string;
  hasLogo: boolean;
  logoVersion: string;
};

export function DesktopNav({
  role,
  logBadgeCount = 0,
  organization = null,
}: {
  role: string;
  logBadgeCount?: number;
  organization?: OrgBranding | null;
}) {
  const pathname = usePathname();
  const links = getNavLinks(role);
  const unreadReplies = useUnreadReplies();
  const effectiveLogBadgeCount = unreadReplies?.logBadgeCount ?? logBadgeCount;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-stone-200 bg-white md:flex">
      <div className="border-b border-stone-100 px-6 py-6">
        {organization?.hasLogo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/organizations/${organization.id}/logo?v=${encodeURIComponent(organization.logoVersion)}`}
            alt={`${organization.name} logo`}
            className="mb-3 max-h-12 w-auto max-w-full object-contain"
          />
        )}
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
          {organization?.name ?? "Career Path"}
        </p>
        <p className="mt-1 text-lg font-bold text-stone-900">Career Path</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          const badgeCount =
            href === "/accountability" ? effectiveLogBadgeCount : 0;
          const linkHref =
            badgeCount > 0 ? `${href}#unread` : href;

          return (
            <Link
              key={href}
              href={linkHref}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-50 text-emerald-900"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
              )}
            >
              <Icon
                className={cn("h-5 w-5 shrink-0", active && "stroke-[2.5]")}
                aria-hidden
              />
              <span className="flex-1">{label}</span>
              <NavBadge count={badgeCount} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
