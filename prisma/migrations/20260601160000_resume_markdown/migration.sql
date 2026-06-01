-- AlterTable
ALTER TABLE "ResumeGeneration" ADD COLUMN "contentMarkdown" TEXT;

UPDATE "ResumeGeneration" SET "contentMarkdown" = '' WHERE "contentMarkdown" IS NULL;

ALTER TABLE "ResumeGeneration" ALTER COLUMN "contentMarkdown" SET NOT NULL;
