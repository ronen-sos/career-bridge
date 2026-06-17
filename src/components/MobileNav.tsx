"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { getNavLinks } from "@/lib/nav-links";
import { useUnreadReplies } from "@/lib/questions/unread-replies.client";

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function MobileNav({
  role,
  logBadgeCount = 0,
}: {
  role: string;
  logBadgeCount?: number;
}) {
  const pathname = usePathname();
  const links = getNavLinks(role);
  const unreadReplies = useUnreadReplies();
  const effectiveLogBadgeCount = unreadReplies?.logBadgeCount ?? logBadgeCount;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur-sm safe-area-bottom md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          const badgeCount =
            href === "/accountability" ? effectiveLogBadgeCount : 0;
          const linkHref =
            badgeCount > 0 ? `${href}#unread` : href;

          return (
            <a
              key={href}
              href={linkHref}
              className={cn(
                "relative flex min-w-[4.5rem] flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                active
                  ? "text-emerald-800"
                  : "text-stone-500 hover:text-stone-800",
              )}
            >
              <span className="relative">
                <Icon
                  className={cn("h-5 w-5", active && "stroke-[2.5]")}
                  aria-hidden
                />
                <NavBadge count={badgeCount} />
              </span>
              {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
