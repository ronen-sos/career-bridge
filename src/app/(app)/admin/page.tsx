import { requireRole } from "@/lib/session";
import { UserAdminPanel } from "@/components/UserAdminPanel";

export default async function AdminPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">User management</h1>
      <p className="mt-1 text-sm text-stone-600 md:mt-2 md:max-w-2xl md:text-base">
        Add program participants and managers. Users sign in with the Google
        account matching their registered email.
      </p>

      <div className="mt-6">
        <UserAdminPanel />
      </div>
    </div>
  );
}
