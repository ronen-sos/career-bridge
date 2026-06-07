-- CreateTable
CREATE TABLE "CompanyCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionCatalog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "resumeGenerationId" TEXT,
    "appliedAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ResumeGeneration" ADD COLUMN "positionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CompanyCatalog_normalizedName_key" ON "CompanyCatalog"("normalizedName");

-- CreateIndex
CREATE INDEX "CompanyCatalog_name_idx" ON "CompanyCatalog"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PositionCatalog_companyId_normalizedTitle_key" ON "PositionCatalog"("companyId", "normalizedTitle");

-- CreateIndex
CREATE INDEX "PositionCatalog_companyId_idx" ON "PositionCatalog"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_resumeGenerationId_key" ON "JobApplication"("resumeGenerationId");

-- CreateIndex
CREATE INDEX "JobApplication_userId_appliedAt_idx" ON "JobApplication"("userId", "appliedAt");

-- CreateIndex
CREATE INDEX "JobApplication_companyId_positionId_idx" ON "JobApplication"("companyId", "positionId");

-- CreateIndex
CREATE INDEX "ResumeGeneration_positionId_createdAt_idx" ON "ResumeGeneration"("positionId", "createdAt");

-- AddForeignKey
ALTER TABLE "PositionCatalog" ADD CONSTRAINT "PositionCatalog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "PositionCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_resumeGenerationId_fkey" FOREIGN KEY ("resumeGenerationId") REFERENCES "ResumeGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeGeneration" ADD CONSTRAINT "ResumeGeneration_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "PositionCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
