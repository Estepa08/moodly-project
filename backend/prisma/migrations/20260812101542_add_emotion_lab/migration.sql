/*
  Warnings:

  - You are about to drop the column `emailVerificationSentAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationToken` on the `User` table. All the data in the column will be lost.
  - Added the required column `category` to the `CbaCommonItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemKey` to the `CbaCommonItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_emailVerificationToken_key";

-- AlterTable
ALTER TABLE "BreathingSession" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CbaCommonItem" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "itemKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CbaEntry" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CbaEntryItem" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CreatureState" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DailyMission" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Device" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Entry" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Feedback" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PracticeCompletion" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SyncCursor" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TestResult" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerificationSentAt",
DROP COLUMN "emailVerificationToken",
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserAchievement" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserPreference" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "emotion_lab_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyAttemptsUsed" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptDate" TIMESTAMP(3),
    "discoveredDyads" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emotion_lab_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emotion_lab_progress_userId_key" ON "emotion_lab_progress"("userId");

-- CreateIndex
CREATE INDEX "CbaCommonItem_itemType_category_idx" ON "CbaCommonItem"("itemType", "category");

-- AddForeignKey
ALTER TABLE "emotion_lab_progress" ADD CONSTRAINT "emotion_lab_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
