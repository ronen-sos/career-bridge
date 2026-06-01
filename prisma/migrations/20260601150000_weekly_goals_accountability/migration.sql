-- CreateEnum
CREATE TYPE "WeeklyGoalStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'COMPLETED');

-- AlterTable: rename targetNetworking -> targetInterviews and add workflow columns
ALTER TABLE "WeeklyGoal" RENAME COLUMN "targetNetworking" TO "targetInterviews";

ALTER TABLE "WeeklyGoal"
  ADD COLUMN "status" "WeeklyGoalStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "managerApprovedAt" TIMESTAMP(3),
  ADD COLUMN "managerApprovedById" TEXT,
  ADD COLUMN "managerApprovalNotes" TEXT,
  ADD COLUMN "weekReviewedAt" TIMESTAMP(3),
  ADD COLUMN "weekReviewedById" TEXT,
  ADD COLUMN "weekReviewNotes" TEXT;

-- Backfill createdById for existing rows
UPDATE "WeeklyGoal" SET "createdById" = "userId" WHERE "createdById" IS NULL;

ALTER TABLE "WeeklyGoal" ALTER COLUMN "createdById" SET NOT NULL;

-- Existing goals with targets are treated as active commitments
UPDATE "WeeklyGoal" SET "status" = 'ACTIVE' WHERE "status" = 'DRAFT';

-- CreateTable
CREATE TABLE "GoalDailyUpdate" (
    "id" TEXT NOT NULL,
    "weeklyGoalId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "applicationsCount" INTEGER NOT NULL DEFAULT 0,
    "interviewsCount" INTEGER NOT NULL DEFAULT 0,
    "hoursWorked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL,
    "managerReviewed" BOOLEAN NOT NULL DEFAULT false,
    "managerReviewedAt" TIMESTAMP(3),
    "managerNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalDailyUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalDailyUpdate_weeklyGoalId_date_key" ON "GoalDailyUpdate"("weeklyGoalId", "date");
CREATE INDEX "GoalDailyUpdate_weeklyGoalId_date_idx" ON "GoalDailyUpdate"("weeklyGoalId", "date");
CREATE INDEX "WeeklyGoal_userId_status_idx" ON "WeeklyGoal"("userId", "status");

-- AddForeignKey
ALTER TABLE "WeeklyGoal" ADD CONSTRAINT "WeeklyGoal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeeklyGoal" ADD CONSTRAINT "WeeklyGoal_managerApprovedById_fkey" FOREIGN KEY ("managerApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WeeklyGoal" ADD CONSTRAINT "WeeklyGoal_weekReviewedById_fkey" FOREIGN KEY ("weekReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GoalDailyUpdate" ADD CONSTRAINT "GoalDailyUpdate_weeklyGoalId_fkey" FOREIGN KEY ("weeklyGoalId") REFERENCES "WeeklyGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
