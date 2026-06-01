-- WeeklyGoal: split targetHours into three hour types
ALTER TABLE "WeeklyGoal"
  ADD COLUMN "targetJobSeekingHours" DOUBLE PRECISION,
  ADD COLUMN "targetEmploymentHours" DOUBLE PRECISION,
  ADD COLUMN "targetEducationHours" DOUBLE PRECISION;

UPDATE "WeeklyGoal"
SET
  "targetJobSeekingHours" = GREATEST("targetHours" * 0.375, 0),
  "targetEmploymentHours" = GREATEST("targetHours" * 0.375, 0),
  "targetEducationHours" = GREATEST("targetHours" * 0.25, 0);

UPDATE "WeeklyGoal"
SET
  "targetJobSeekingHours" = 15,
  "targetEmploymentHours" = 15,
  "targetEducationHours" = 10
WHERE ("targetJobSeekingHours" + "targetEmploymentHours" + "targetEducationHours") < 40;

ALTER TABLE "WeeklyGoal"
  ALTER COLUMN "targetJobSeekingHours" SET NOT NULL,
  ALTER COLUMN "targetJobSeekingHours" SET DEFAULT 15,
  ALTER COLUMN "targetEmploymentHours" SET NOT NULL,
  ALTER COLUMN "targetEmploymentHours" SET DEFAULT 15,
  ALTER COLUMN "targetEducationHours" SET NOT NULL,
  ALTER COLUMN "targetEducationHours" SET DEFAULT 10;

ALTER TABLE "WeeklyGoal" DROP COLUMN "targetHours";

-- GoalDailyUpdate: split hoursWorked into three hour types
ALTER TABLE "GoalDailyUpdate"
  ADD COLUMN "jobSeekingHours" DOUBLE PRECISION,
  ADD COLUMN "employmentHours" DOUBLE PRECISION,
  ADD COLUMN "educationHours" DOUBLE PRECISION;

UPDATE "GoalDailyUpdate"
SET
  "employmentHours" = "hoursWorked",
  "jobSeekingHours" = 0,
  "educationHours" = 0;

ALTER TABLE "GoalDailyUpdate"
  ALTER COLUMN "jobSeekingHours" SET NOT NULL,
  ALTER COLUMN "jobSeekingHours" SET DEFAULT 0,
  ALTER COLUMN "employmentHours" SET NOT NULL,
  ALTER COLUMN "employmentHours" SET DEFAULT 0,
  ALTER COLUMN "educationHours" SET NOT NULL,
  ALTER COLUMN "educationHours" SET DEFAULT 0;

ALTER TABLE "GoalDailyUpdate" DROP COLUMN "hoursWorked";
