/*
  Warnings:

  - You are about to drop the `emotion_lab_progress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "emotion_lab_progress" DROP CONSTRAINT "emotion_lab_progress_userId_fkey";

-- DropTable
DROP TABLE "emotion_lab_progress";

-- CreateTable
CREATE TABLE "EmotionLabProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyAttemptsUsed" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptDate" TIMESTAMP(3),
    "discoveredDyads" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmotionLabProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmotionLabProgress_userId_key" ON "EmotionLabProgress"("userId");

-- AddForeignKey
ALTER TABLE "EmotionLabProgress" ADD CONSTRAINT "EmotionLabProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
