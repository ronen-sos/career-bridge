-- CreateTable
CREATE TABLE "ParticipantQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "weeklyGoalId" TEXT,
    "question" TEXT NOT NULL,
    "managerRead" BOOLEAN NOT NULL DEFAULT false,
    "managerReadAt" TIMESTAMP(3),
    "managerReply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParticipantQuestion_managerId_managerRead_createdAt_idx" ON "ParticipantQuestion"("managerId", "managerRead", "createdAt");

-- CreateIndex
CREATE INDEX "ParticipantQuestion_userId_createdAt_idx" ON "ParticipantQuestion"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ParticipantQuestion" ADD CONSTRAINT "ParticipantQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantQuestion" ADD CONSTRAINT "ParticipantQuestion_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantQuestion" ADD CONSTRAINT "ParticipantQuestion_weeklyGoalId_fkey" FOREIGN KEY ("weeklyGoalId") REFERENCES "WeeklyGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
