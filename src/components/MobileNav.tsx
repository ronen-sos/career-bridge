"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  ClipboardList,
  Home,
  BookOpen,
  Users,
} from "lucide-react";

import { cn } from "@/lib/cn";

const participantLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/accountability", label: "Log", icon: ClipboardList },
  { href: "/resources", label: "Learn", icon: BookOpen },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
];

const managerLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/manager", label: "Team", icon: Users },
  { href: "/resources", label: "Learn", icon: BookOpen },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
];

export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname();
  const links =
    role === "MANAGER" || role === "ADMIN" ? managerLinks : participantLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur-sm safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[4.5rem] flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                active
                  ? "text-emerald-800"
                  : "text-stone-500 hover:text-stone-800",
              )}
            >
              <Icon
                className={cn("h-5 w-5", active && "stroke-[2.5]")}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
