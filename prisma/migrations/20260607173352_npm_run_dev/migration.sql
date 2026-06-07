-- DropIndex
DROP INDEX "WeeklyGoal_userId_weekStart_weekEnd_idx";

-- AlterTable
ALTER TABLE "WeeklyGoal" ALTER COLUMN "targetInterviews" SET DEFAULT 1;
