import {
  ClipboardList,
  Home,
  BookOpen,
  Users,
  Shield,
  UserCircle,
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
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/resources", label: "Learn", icon: BookOpen },
];

export const managerLinks: NavLink[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/manager", label: "Team", icon: Users },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/resources", label: "Learn", icon: BookOpen },
];

export const adminLinks: NavLink[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/admin", label: "Users", icon: Shield },
  { href: "/admin/employers", label: "Employers", icon: ClipboardList },
  { href: "/manager", label: "Team", icon: Users },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/resources", label: "Learn", icon: BookOpen },
];

export function getNavLinks(role: string): NavLink[] {
  if (role === "ADMIN") return adminLinks;
  if (role === "MANAGER") return managerLinks;
  return participantLinks;
}
