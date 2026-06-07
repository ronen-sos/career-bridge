ALTER TABLE "WeeklyGoal" ADD COLUMN "weekEnd" DATE;

UPDATE "WeeklyGoal" SET "weekEnd" = "weekStart" + INTERVAL '6 days' WHERE "weekEnd" IS NULL;

ALTER TABLE "WeeklyGoal" ALTER COLUMN "weekEnd" SET NOT NULL;

CREATE INDEX "WeeklyGoal_userId_weekStart_weekEnd_idx" ON "WeeklyGoal"("userId", "weekStart", "weekEnd");
