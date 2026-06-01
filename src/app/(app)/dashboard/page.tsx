import Link from "next/link";
import { signOut } from "@/lib/auth";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { getWeekStart } from "@/lib/format";
import { goalInclude } from "@/lib/goals/access";
import { computeGoalProgress } from "@/lib/goals/progress";
import { GoalProgressSummary } from "@/components/goals/GoalProgressSummary";
import { ActivityList } from "@/components/ActivityList";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const session = await requireAuth();
  const weekStart = getWeekStart();

  if (session.user.role === "ADMIN") {
    const participantCount = await db.user.count({
      where: { role: "PARTICIPANT" },
    });
    const userCount = await db.user.count();
    const pendingActivityReviews = await db.jobSearchActivity.count({
      where: { managerReviewed: false },
    });
    const pendingGoalApprovals = await db.weeklyGoal.count({
      where: { status: "PENDING_APPROVAL" },
    });
    const pendingUpdateReviews = await db.goalDailyUpdate.count({
      where: {
        managerReviewed: false,
        weeklyGoal: { weekStart, status: "ACTIVE" },
      },
    });

    return (
      <div className="px-4 py-6 md:px-8 md:py-8">
        <Header name={session.user.name ?? "Admin"} subtitle="Administrator" />
        <div className="mt-6 space-y-4">
          <Card>
            <CardTitle>Program overview</CardTitle>
            <CardDescription>
              Manage users, monitor team progress, and oversee the program.
            </CardDescription>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
              <StatBox label="Users" value={userCount} />
              <StatBox label="Participants" value={participantCount} />
              <StatBox label="Goals to approve" value={pendingGoalApprovals} />
              <StatBox label="Updates to review" value={pendingUpdateReviews} />
              <StatBox label="Activities to review" value={pendingActivityReviews} />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link href="/admin" className="block sm:flex-1">
                <Button className="w-full">Manage users</Button>
              </Link>
              <Link href="/manager" className="block sm:flex-1">
                <Button variant="secondary" className="w-full">
                  View team progress
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (session.user.role === "MANAGER") {
    const participantCount = await db.user.count({
      where: { role: "PARTICIPANT", managerId: session.user.id },
    });
    const weekStart = getWeekStart();
    const pendingGoalApprovals = await db.weeklyGoal.count({
      where: {
        status: "PENDING_APPROVAL",
        user: { managerId: session.user.id },
      },
    });
    const pendingUpdateReviews = await db.goalDailyUpdate.count({
      where: {
        managerReviewed: false,
        weeklyGoal: {
          user: { managerId: session.user.id },
          weekStart,
        },
      },
    });
    const pendingActivityReviews = await db.jobSearchActivity.count({
      where: {
        managerReviewed: false,
        user: { managerId: session.user.id },
      },
    });

    return (
      <div className="px-4 py-6 md:px-8 md:py-8">
        <Header name={session.user.name ?? "Manager"} subtitle="Program Manager" />
        <div className="mt-6 space-y-4">
          <Card>
            <CardTitle>Team overview</CardTitle>
            <CardDescription>
              Monitor participant goals, daily check-ins, and job search activity.
            </CardDescription>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <StatBox label="Participants" value={participantCount} />
              <StatBox label="Goals to approve" value={pendingGoalApprovals} />
              <StatBox label="Updates to review" value={pendingUpdateReviews} />
              <StatBox label="Activities to review" value={pendingActivityReviews} />
            </div>
            <Link href="/manager" className="mt-4 block md:max-w-xs">
              <Button className="w-full">View team progress</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const goal = await db.weeklyGoal.findUnique({
    where: {
      userId_weekStart: { userId: session.user.id, weekStart },
    },
    include: goalInclude,
  });

  const stats = goal
    ? computeGoalProgress(goal, goal.dailyUpdates)
    : {
        applications: 0,
        interviews: 0,
        jobSeekingHours: 0,
        employmentHours: 0,
        educationHours: 0,
        totalHours: 0,
        targetApplications: 5,
        targetInterviews: 1,
        targetJobSeekingHours: 15,
        targetEmploymentHours: 15,
        targetEducationHours: 10,
        targetTotalHours: 40,
      };

  const unreviewedUpdates =
    goal?.dailyUpdates.filter((u) => !u.managerReviewed).length ?? 0;

  const recentActivities = await db.jobSearchActivity.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 5,
  });

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <Header
        name={session.user.name ?? "Participant"}
        subtitle="Your job search dashboard"
      />

      {!goal && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardTitle>Set this week&apos;s goals</CardTitle>
          <CardDescription>
            Work with your manager to set targets, then check in daily.
          </CardDescription>
          <Link href="/goals" className="mt-3 inline-block">
            <Button size="sm">Go to goals</Button>
          </Link>
        </Card>
      )}

      {goal?.status === "PENDING_APPROVAL" && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardTitle>Goals awaiting approval</CardTitle>
          <CardDescription>
            Your manager needs to approve this week&apos;s goals before daily
            check-ins begin.
          </CardDescription>
        </Card>
      )}

      {unreviewedUpdates > 0 && goal?.status === "ACTIVE" && (
        <Card className="mt-6 border-stone-200">
          <CardDescription>
            {unreviewedUpdates} daily update
            {unreviewedUpdates === 1 ? "" : "s"} pending manager review.
          </CardDescription>
        </Card>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-6">
        <GoalProgressSummary stats={stats} status={goal?.status} />

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

      {goal?.status === "ACTIVE" && (
        <div className="mt-4 text-center">
          <Link href="/goals" className="text-sm font-medium text-emerald-800">
            Submit today&apos;s check-in →
          </Link>
        </div>
      )}
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
