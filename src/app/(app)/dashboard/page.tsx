import Link from "next/link";
import { signOut } from "@/lib/auth";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { getWeekStart } from "@/lib/format";
import { ProgressSummary } from "@/components/ProgressSummary";
import { ActivityList } from "@/components/ActivityList";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const session = await requireAuth();
  const weekStart = getWeekStart();

  if (session.user.role === "MANAGER" || session.user.role === "ADMIN") {
    const participantCount = await db.user.count({
      where: { role: "PARTICIPANT" },
    });
    const pendingReviews = await db.jobSearchActivity.count({
      where: { managerReviewed: false },
    });

    return (
      <div className="px-4 py-6">
        <Header name={session.user.name ?? "Manager"} subtitle="Program Manager" />
        <div className="mt-6 space-y-4">
          <Card>
            <CardTitle>Team overview</CardTitle>
            <CardDescription>
              Monitor participant job search activity and provide feedback.
            </CardDescription>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatBox label="Participants" value={participantCount} />
              <StatBox label="Pending reviews" value={pendingReviews} />
            </div>
            <Link href="/manager" className="mt-4 block">
              <Button className="w-full">View team progress</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      activities: {
        where: { date: { gte: weekStart } },
        orderBy: { date: "desc" },
      },
      weeklyGoals: {
        where: { weekStart },
        take: 1,
      },
    },
  });

  const goal = user?.weeklyGoals[0] ?? {
    targetApplications: 5,
    targetNetworking: 3,
    targetHours: 10,
  };

  const weekActivities = user?.activities ?? [];
  const stats = {
    applications: weekActivities.filter((a) => a.type === "APPLICATION").length,
    networking: weekActivities.filter((a) => a.type === "NETWORKING").length,
    interviews: weekActivities.filter((a) => a.type === "INTERVIEW").length,
    hours: weekActivities.reduce((sum, a) => sum + a.hoursSpent, 0),
    targetApplications: goal.targetApplications,
    targetNetworking: goal.targetNetworking,
    targetHours: goal.targetHours,
  };

  const recentActivities = await db.jobSearchActivity.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 5,
  });

  return (
    <div className="px-4 py-6">
      <Header
        name={session.user.name ?? "Participant"}
        subtitle="Your job search dashboard"
      />

      <div className="mt-6 space-y-4">
        <ProgressSummary stats={stats} />

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Your latest job search actions</CardDescription>
            </div>
            <Link href="/accountability" className="text-sm font-medium text-emerald-800">
              Log new →
            </Link>
          </div>
          <div className="mt-4">
            <ActivityList activities={recentActivities} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Header({ name, subtitle }: { name: string; subtitle: string }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-emerald-800">Career Bridge</p>
        <h1 className="text-2xl font-bold text-stone-900">Hello, {name.split(" ")[0]}</h1>
        <p className="text-sm text-stone-600">{subtitle}</p>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <Button type="submit" variant="ghost" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">
      <p className="text-2xl font-bold text-emerald-900">{value}</p>
      <p className="text-xs text-emerald-700">{label}</p>
    </div>
  );
}
