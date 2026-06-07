-- AlterTable
ALTER TABLE "WeeklyGoal" DROP COLUMN "targetJobSeekingHours";
ALTER TABLE "WeeklyGoal" DROP COLUMN "targetEducationHours";

-- AlterTable
ALTER TABLE "GoalDailyUpdate" DROP COLUMN "jobSeekingHours";
ALTER TABLE "GoalDailyUpdate" DROP COLUMN "educationHours";
