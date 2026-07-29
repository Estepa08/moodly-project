-- AlterTable
ALTER TABLE "CreatureState" ADD COLUMN     "energy" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "experience" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastCheckInAt" TIMESTAMP(3),
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'standard';

-- CreateTable
CREATE TABLE "TestScoreBand" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "interpretation" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,

    CONSTRAINT "TestScoreBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goals" JSONB NOT NULL DEFAULT '[]',
    "experienceLevel" TEXT NOT NULL DEFAULT 'beginner',
    "dailyReminder" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" TEXT DEFAULT '09:00',
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "showSupportResources" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestScoreBand_testId_idx" ON "TestScoreBand"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "PracticeCompletion_userId_idx" ON "PracticeCompletion"("userId");

-- CreateIndex
CREATE INDEX "PracticeCompletion_userId_createdAt_idx" ON "PracticeCompletion"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "TestScoreBand" ADD CONSTRAINT "TestScoreBand_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeCompletion" ADD CONSTRAINT "PracticeCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
