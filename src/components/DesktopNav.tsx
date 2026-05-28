"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { getNavLinks } from "@/lib/nav-links";

export function DesktopNav({ role }: { role: string }) {
  const pathname = usePathname();
  const links = getNavLinks(role);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-stone-200 bg-white md:flex">
      <div className="border-b border-stone-100 px-6 py-6">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
          Bridge to Thrive
        </p>
        <p className="mt-1 text-lg font-bold text-stone-900">Career Bridge</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
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
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
