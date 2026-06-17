import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/lib/auth";
import { requireAuth } from "@/lib/session";
import { isAdminRole, isSuperAdmin, orgScope } from "@/lib/roles";
import { db } from "@/lib/db";
import { findParticipantCurrentGoal } from "@/lib/goals/access";
import { computeGoalProgress, formatWeekRange, isDateInWeek, toDateInputValue } from "@/lib/goals/progress";
import { computeCustomGoalProgress } from "@/lib/goals/custom-items";
import { computeGoalPace } from "@/lib/goals/pace";
import { countApplicationsInPeriod } from "@/lib/applications/record.server";
import { countInterviewsInPeriod } from "@/lib/interviews/record.server";
import { BridgeProgressCard } from "@/components/goals/BridgeProgressCard";
import { ParticipantGoalsSummary } from "@/components/goals/ParticipantGoalsSummary";
import { ApplicationsProgressCard } from "@/components/applications/ApplicationsProgressCard";
import { ParticipantDashboardActions } from "@/components/dashboard/ParticipantDashboardActions";
import { ParticipantMessagesSection } from "@/components/dashboard/ParticipantMessagesSection";
import { hasUnreadManagerReply } from "@/lib/questions/unread";
import { ActivityList } from "@/components/ActivityList";
import {
  activityFeedInclude,
  serializeActivitiesForFeed,
} from "@/lib/activities/feed.server";
import {
  countUnreadQuestionsAll,
  countUnreadQuestionsForManager,
  listQuestionsForUser,
} from "@/lib/questions/record.server";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";

export default async function DashboardPage() {
  const session = await requireAuth();

  if (isAdminRole(session.user.role)) {
    const scope = orgScope(session.user);
    const [
      participantCount,
      userCount,
      pendingActivityReviews,
      draftGoals,
      pendingQuestionReviews,
    ] = await Promise.all([
      db.user.count({ where: { role: "PARTICIPANT", ...scope } }),
      db.user.count({ where: { ...scope } }),
      db.jobSearchActivity.count({
        where: { managerReviewed: false, user: { ...scope } },
      }),
      db.weeklyGoal.count({
        where: {
          status: { in: ["DRAFT", "PENDING_APPROVAL"] },
          user: { ...scope },
        },
      }),
      countUnreadQuestionsAll(
        isSuperAdmin(session.user.role)
          ? undefined
          : { organizationId: session.user.organizationId ?? undefined },
      ),
    ]);

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
              <StatBox label="Goals to activate" value={draftGoals} />
              <StatBox label="Questions to review" value={pendingQuestionReviews} />
              <StatBox label="Activities to review" value={pendingActivityReviews} />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {isSuperAdmin(session.user.role) && (
                <ButtonLink href="/super-admin" className="w-full sm:flex-1">
                  Organizations
                </ButtonLink>
              )}
              <ButtonLink href="/admin" className="w-full sm:flex-1">
                Manage users
              </ButtonLink>
              <ButtonLink
                href="/admin/employers"
                variant="secondary"
                className="w-full sm:flex-1"
              >
                Employer activity
              </ButtonLink>
              <ButtonLink
                href="/manager"
                variant="secondary"
                className="w-full sm:flex-1"
              >
                View team progress
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (session.user.role === "MANAGER") {
    const [
      participantCount,
      draftGoals,
      pendingQuestionReviews,
      pendingActivityReviews,
    ] = await Promise.all([
      db.user.count({
        where: { role: "PARTICIPANT", managerId: session.user.id },
      }),
      db.weeklyGoal.count({
        where: {
          status: { in: ["DRAFT", "PENDING_APPROVAL"] },
          user: { managerId: session.user.id },
        },
      }),
      countUnreadQuestionsForManager(session.user.id),
      db.jobSearchActivity.count({
        where: {
          managerReviewed: false,
          user: { managerId: session.user.id },
        },
      }),
    ]);

    return (
      <div className="px-4 py-6 md:px-8 md:py-8">
        <Header name={session.user.name ?? "Manager"} subtitle="Program Manager" />
        <div className="mt-6 space-y-4">
          <Card>
            <CardTitle>Team overview</CardTitle>
            <CardDescription>
              Monitor participant goals, questions, and job search activity.
            </CardDescription>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <StatBox label="Participants" value={participantCount} />
              <StatBox label="Goals to activate" value={draftGoals} />
              <StatBox label="Questions to review" value={pendingQuestionReviews} />
              <StatBox label="Activities to review" value={pendingActivityReviews} />
            </div>
            <ButtonLink href="/manager" className="mt-4 w-full md:max-w-xs">
              View team progress
            </ButtonLink>
          </Card>
        </div>
      </div>
    );
  }

  const [goal, participantUser, questions] = await Promise.all([
    findParticipantCurrentGoal(session.user.id),
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        managerId: true,
        manager: { select: { name: true } },
      },
    }),
    listQuestionsForUser(session.user.id, "PARTICIPANT"),
  ]);

  const managerName =
    participantUser?.manager?.name ??
    (participantUser?.managerId ? "your program manager" : null);

  const [recordedApplications, recordedInterviews, recentApplications] =
    await Promise.all([
      goal
        ? countApplicationsInPeriod(session.user.id, goal.weekStart, goal.weekEnd)
        : 0,
      goal
        ? countInterviewsInPeriod(session.user.id, goal.weekStart, goal.weekEnd)
        : 0,
      db.jobApplication.findMany({
        where: { userId: session.user.id },
        orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }],
        take: 5,
        include: {
          company: { select: { id: true, name: true } },
          position: { select: { id: true, title: true } },
        },
      }),
    ]);

  const stats = goal
    ? computeGoalProgress(
        goal,
        goal.dailyUpdates,
        recordedApplications,
        recordedInterviews,
      )
    : {
        applications: recordedApplications,
        interviews: recordedInterviews,
        employmentHours: 0,
        totalHours: 0,
        targetApplications: 5,
        targetInterviews: 1,
        targetEmploymentHours: 15,
        targetTotalHours: 15,
      };

  const customProgress = goal
    ? computeCustomGoalProgress(goal.customItems, goal.dailyUpdates)
    : [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [loggedActivityToday, recentActivities] = await Promise.all([
    db.jobSearchActivity
      .count({
        where: {
          userId: session.user.id,
          date: { gte: todayStart, lte: todayEnd },
        },
      })
      .then((count) => count > 0),
    db.jobSearchActivity.findMany({
      where: { userId: session.user.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: activityFeedInclude,
    }),
  ]);

  const pace =
    goal?.status === "ACTIVE"
      ? computeGoalPace(
          { weekStart: goal.weekStart, weekEnd: goal.weekEnd },
          stats,
          {
            customItems: customProgress,
            dailyUpdateDates: goal.dailyUpdates.map((u) => u.date),
            loggedActivityToday,
          },
        )
      : null;

  const todayKey = new Date().toISOString().split("T")[0]!;
  const todayUpdate = goal?.dailyUpdates.find(
    (update) => toDateInputValue(update.date) === todayKey,
  );

  const goalPeriodActive =
    goal?.status === "ACTIVE" &&
    isDateInWeek(new Date(), goal.weekStart, goal.weekEnd);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <Header
        name={session.user.name ?? "Participant"}
        subtitle="Your job search dashboard"
      />

      {!goal && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardTitle>Goals not set yet</CardTitle>
          <CardDescription>
            Your program manager will set your targets for this period. Check
            back here once goals are active.
          </CardDescription>
        </Card>
      )}

      {goal?.status === "DRAFT" && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardTitle>Goals awaiting activation</CardTitle>
          <CardDescription>
            Your program manager has set goals but has not activated them yet.
            Progress tracking will open once they do.
          </CardDescription>
        </Card>
      )}

      {pace && goal && (
        <div className="mt-6">
          <BridgeProgressCard
            pace={pace}
            weekStart={toDateInputValue(goal.weekStart)}
            weekEnd={toDateInputValue(goal.weekEnd)}
            weekRange={formatWeekRange(goal.weekStart, goal.weekEnd)}
            goalId={goal.id}
          />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {goal && (
          <ParticipantGoalsSummary
            weekStart={goal.weekStart.toISOString()}
            weekEnd={goal.weekEnd.toISOString()}
            status={goal.status}
            progress={stats}
            customItems={customProgress}
            managerApprovalNotes={goal.managerApprovalNotes}
            managerNotes={goal.notes}
            weekReviewNotes={goal.weekReviewNotes}
          />
        )}

        <ParticipantDashboardActions
          hoursLog={
            goalPeriodActive
              ? {
                  goalId: goal.id,
                  weekStart: toDateInputValue(goal.weekStart),
                  weekEnd: toDateInputValue(goal.weekEnd),
                  existingUpdate: todayUpdate
                    ? {
                        applicationsCount: todayUpdate.applicationsCount,
                        interviewsCount: todayUpdate.interviewsCount,
                        employmentHours: todayUpdate.employmentHours,
                      }
                    : null,
                }
              : null
          }
          customGoalsLog={
            goalPeriodActive && goal.customItems.length > 0
              ? {
                  goalId: goal.id,
                  customItems: goal.customItems.map((item) => ({
                    id: item.id,
                    label: item.label,
                    expectedHours: item.expectedHours,
                  })),
                  dailyUpdates: goal.dailyUpdates.map((update) => ({
                    customCompletions: update.customCompletions.map((c) => ({
                      customItemId: c.customItemId,
                      completed: c.completed,
                    })),
                  })),
                }
              : null
          }
          askManager={
            managerName
              ? { managerName }
              : null
          }
        />

        <ApplicationsProgressCard
          applications={recentApplications.map((application) => ({
            id: application.id,
            appliedAt: application.appliedAt.toISOString(),
            company: application.company,
            position: application.position,
          }))}
          currentCount={stats.applications}
          targetCount={stats.targetApplications}
          interviewCount={stats.interviews}
          interviewTarget={stats.targetInterviews}
          status={goal?.status}
        />

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
            <ActivityList
              activities={serializeActivitiesForFeed(recentActivities)}
              showApplicationActions
            />
          </div>
        </Card>

        {managerName && (
          <Suspense fallback={null}>
            <ParticipantMessagesSection
              questions={questions.map((q) => ({
                id: q.id,
                question: q.question,
                managerReply: q.managerReply,
                createdAt: q.createdAt.toISOString(),
                unreadReply: hasUnreadManagerReply(q),
              }))}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

function Header({ name, subtitle }: { name: string; subtitle: string }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-emerald-800">Career Path</p>
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
