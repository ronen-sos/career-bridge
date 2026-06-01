-- CreateTable
CREATE TABLE "ResumeGeneration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT,
    "targetCompany" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeGeneration_userId_createdAt_idx" ON "ResumeGeneration"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ResumeGeneration" ADD CONSTRAINT "ResumeGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
