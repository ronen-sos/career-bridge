import { OrganizationsPanel } from "@/components/super-admin/OrganizationsPanel";

export default function SuperAdminPage() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">
        Organizations
      </h1>
      <p className="mt-1 text-sm text-stone-600 md:mt-2 md:max-w-2xl md:text-base">
        Provision organizations, upload their logos, and create their admins.
        Each organization&apos;s admins can only see and manage their own
        people.
      </p>

      <div className="mt-6">
        <OrganizationsPanel />
      </div>
    </div>
  );
}
