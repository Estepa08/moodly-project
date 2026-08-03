-- AlterTable
ALTER TABLE "UserAchievement" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "UserAchievement_userId_updatedAt_idx" ON "UserAchievement"("userId", "updatedAt");
