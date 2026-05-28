import {
  Briefcase,
  ClipboardList,
  Home,
  BookOpen,
  Users,
  Shield,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const participantLinks: NavLink[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/accountability", label: "Log", icon: ClipboardList },
  { href: "/resources", label: "Learn", icon: BookOpen },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
];

export const managerLinks: NavLink[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/manager", label: "Team", icon: Users },
  { href: "/resources", label: "Learn", icon: BookOpen },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
];

export const adminLinks: NavLink[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/admin", label: "Users", icon: Shield },
  { href: "/manager", label: "Team", icon: Users },
  { href: "/resources", label: "Learn", icon: BookOpen },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
];

export function getNavLinks(role: string): NavLink[] {
  if (role === "ADMIN") return adminLinks;
  if (role === "MANAGER") return managerLinks;
  return participantLinks;
}
