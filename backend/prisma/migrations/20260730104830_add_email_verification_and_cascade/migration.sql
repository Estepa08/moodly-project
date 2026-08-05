aitunnel-- AlterTable: add email verification fields to User
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerificationSentAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");

-- AlterTable: existing users should have emailVerified = true
-- so they don't get locked out by the new login check
UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false;

-- Drop existing foreign keys and re-add with ON DELETE CASCADE
ALTER TABLE "Entry" DROP CONSTRAINT IF EXISTS "Entry_userId_fkey",
  ADD CONSTRAINT "Entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestResult" DROP CONSTRAINT IF EXISTS "TestResult_userId_fkey",
  ADD CONSTRAINT "TestResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Feedback" DROP CONSTRAINT IF EXISTS "Feedback_userId_fkey",
  ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" DROP CONSTRAINT IF EXISTS "Report_userId_fkey",
  ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_userId_fkey",
  ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResetToken" DROP CONSTRAINT IF EXISTS "ResetToken_userId_fkey",
  ADD CONSTRAINT "ResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BreathingSession" DROP CONSTRAINT IF EXISTS "BreathingSession_userId_fkey",
  ADD CONSTRAINT "BreathingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeCompletion" DROP CONSTRAINT IF EXISTS "PracticeCompletion_userId_fkey",
  ADD CONSTRAINT "PracticeCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CbaEntry" DROP CONSTRAINT IF EXISTS "CbaEntry_userId_fkey",
  ADD CONSTRAINT "CbaEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPreference" DROP CONSTRAINT IF EXISTS "UserPreference_userId_fkey",
  ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_userId_fkey",
  ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAchievement" DROP CONSTRAINT IF EXISTS "UserAchievement_userId_fkey",
  ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign keys for models that were missing them
ALTER TABLE "CreatureState" DROP CONSTRAINT IF EXISTS "CreatureState_userId_fkey",
  ADD CONSTRAINT "CreatureState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyMission" DROP CONSTRAINT IF EXISTS "DailyMission_userId_fkey",
  ADD CONSTRAINT "DailyMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;
