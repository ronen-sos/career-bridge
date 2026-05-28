import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { ActivityLogForm } from "@/components/ActivityLogForm";
import { ActivityList } from "@/components/ActivityList";

export default async function AccountabilityPage() {
  const session = await requireAuth();

  const activities = await db.jobSearchActivity.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">Job search log</h1>
      <p className="mt-1 text-sm text-stone-600 md:mt-2 md:text-base">
        Record your daily job search activities for accountability with your
        program manager.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
        <ActivityLogForm />
        <div>
          <h2 className="mb-3 text-lg font-semibold text-stone-900">
            Your history
          </h2>
          <ActivityList activities={activities} />
        </div>
      </div>
    </div>
  );
}
