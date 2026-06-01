-- CreateTable
CREATE TABLE "GoalCustomItem" (
    "id" TEXT NOT NULL,
    "weeklyGoalId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalCustomItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalCustomItemCompletion" (
    "id" TEXT NOT NULL,
    "customItemId" TEXT NOT NULL,
    "dailyUpdateId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalCustomItemCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalCustomItem_weeklyGoalId_sortOrder_idx" ON "GoalCustomItem"("weeklyGoalId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "GoalCustomItemCompletion_customItemId_dailyUpdateId_key" ON "GoalCustomItemCompletion"("customItemId", "dailyUpdateId");

-- AddForeignKey
ALTER TABLE "GoalCustomItem" ADD CONSTRAINT "GoalCustomItem_weeklyGoalId_fkey" FOREIGN KEY ("weeklyGoalId") REFERENCES "WeeklyGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GoalCustomItemCompletion" ADD CONSTRAINT "GoalCustomItemCompletion_customItemId_fkey" FOREIGN KEY ("customItemId") REFERENCES "GoalCustomItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GoalCustomItemCompletion" ADD CONSTRAINT "GoalCustomItemCompletion_dailyUpdateId_fkey" FOREIGN KEY ("dailyUpdateId") REFERENCES "GoalDailyUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
