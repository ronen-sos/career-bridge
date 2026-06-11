import Link from "next/link";

import { requireRole } from "@/lib/session";
import { getUserAdminData } from "@/lib/users/list.server";
import { UserAdminPanel } from "@/components/UserAdminPanel";

export default async function AdminPage() {
  const session = await requireRole(["ADMIN"]);
  const initialData = await getUserAdminData(session.user);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">User management</h1>
      <p className="mt-1 text-sm text-stone-600 md:mt-2 md:max-w-2xl md:text-base">
        Invite participants and managers by email. They&apos;ll receive a welcome
        message with a link to sign in using their Google account.
      </p>

      <div className="mt-4">
        <Link
          href="/admin/employers"
          className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
        >
          View employer follow-through stats →
        </Link>
      </div>

      <div className="mt-6">
        <UserAdminPanel initialData={initialData} />
      </div>
    </div>
  );
}
