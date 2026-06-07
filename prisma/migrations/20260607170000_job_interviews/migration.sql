-- CreateEnum
CREATE TYPE "InterviewApplicationLink" AS ENUM ('LINKED_APPLICATION', 'NO_PRIOR_APPLICATION', 'RETROACTIVE_APPLICATION');

-- CreateTable
CREATE TABLE "JobInterview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "applicationId" TEXT,
    "interviewedAt" DATE NOT NULL,
    "linkType" "InterviewApplicationLink" NOT NULL,
    "notes" TEXT,
    "hoursSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobInterview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobInterview_userId_interviewedAt_idx" ON "JobInterview"("userId", "interviewedAt");

-- CreateIndex
CREATE INDEX "JobInterview_companyId_interviewedAt_idx" ON "JobInterview"("companyId", "interviewedAt");

-- CreateIndex
CREATE INDEX "JobInterview_applicationId_idx" ON "JobInterview"("applicationId");

-- AddForeignKey
ALTER TABLE "JobInterview" ADD CONSTRAINT "JobInterview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobInterview" ADD CONSTRAINT "JobInterview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobInterview" ADD CONSTRAINT "JobInterview_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "PositionCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobInterview" ADD CONSTRAINT "JobInterview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
