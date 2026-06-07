-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'RESUME';

-- AlterTable
ALTER TABLE "JobSearchActivity" ADD COLUMN "resumeGenerationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "JobSearchActivity_resumeGenerationId_key" ON "JobSearchActivity"("resumeGenerationId");

-- AddForeignKey
ALTER TABLE "JobSearchActivity" ADD CONSTRAINT "JobSearchActivity_resumeGenerationId_fkey" FOREIGN KEY ("resumeGenerationId") REFERENCES "ResumeGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
