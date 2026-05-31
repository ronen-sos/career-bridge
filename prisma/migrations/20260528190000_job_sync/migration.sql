-- AlterTable: require apply URL and add sync metadata
ALTER TABLE "JobOpportunity" ADD COLUMN "externalId" TEXT;
ALTER TABLE "JobOpportunity" ADD COLUMN "isRecoveryFriendly" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "JobOpportunity" ADD COLUMN "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Remove placeholder listings without real apply links before enforcing NOT NULL
DELETE FROM "JobOpportunity" WHERE "url" IS NULL;

ALTER TABLE "JobOpportunity" ALTER COLUMN "url" SET NOT NULL;

CREATE UNIQUE INDEX "JobOpportunity_externalId_key" ON "JobOpportunity"("externalId");
CREATE INDEX "JobOpportunity_isActive_postedAt_idx" ON "JobOpportunity"("isActive", "postedAt");

-- CreateTable
CREATE TABLE "JobSyncLog" (
    "id" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobsFound" INTEGER NOT NULL DEFAULT 0,
    "jobsUpserted" INTEGER NOT NULL DEFAULT 0,
    "jobsDeactivated" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "message" TEXT,

    CONSTRAINT "JobSyncLog_pkey" PRIMARY KEY ("id")
);
