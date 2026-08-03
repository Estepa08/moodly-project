-- AlterTable
ALTER TABLE "BreathingSession" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "CbaEntry" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "CbaEntryItem" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "CreatureState" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "DailyMission" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Entry" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PracticeCompletion" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN "deviceId" TEXT;

-- AlterTable
ALTER TABLE "TestResult" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userAgent" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncCursor" (
    "userId" TEXT NOT NULL,
    "lastPulledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncCursor_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "Device_userId_idx" ON "Device"("userId");
CREATE INDEX "Device_userId_updatedAt_idx" ON "Device"("userId", "updatedAt");
CREATE INDEX "BreathingSession_userId_updatedAt_idx" ON "BreathingSession"("userId", "updatedAt");
CREATE INDEX "CbaEntry_userId_updatedAt_idx" ON "CbaEntry"("userId", "updatedAt");
CREATE UNIQUE INDEX "DailyMission_userId_date_missionKey_key" ON "DailyMission"("userId", "date", "missionKey");
CREATE INDEX "Entry_userId_updatedAt_idx" ON "Entry"("userId", "updatedAt");
CREATE INDEX "Feedback_userId_updatedAt_idx" ON "Feedback"("userId", "updatedAt");
CREATE INDEX "PracticeCompletion_userId_updatedAt_idx" ON "PracticeCompletion"("userId", "updatedAt");
CREATE INDEX "RefreshToken_deviceId_idx" ON "RefreshToken"("deviceId");
CREATE INDEX "TestResult_userId_updatedAt_idx" ON "TestResult"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SyncCursor" ADD CONSTRAINT "SyncCursor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep "updatedAt" in sync on every UPDATE, including raw SQL writes from the
-- offline-first sync layer. Mirrors Prisma's own generated trigger.
CREATE OR REPLACE FUNCTION "set_updated_at"() RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "BreathingSession_updated_at_trigger" BEFORE UPDATE ON "BreathingSession" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
CREATE TRIGGER "CbaEntry_updated_at_trigger" BEFORE UPDATE ON "CbaEntry" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
CREATE TRIGGER "CbaEntryItem_updated_at_trigger" BEFORE UPDATE ON "CbaEntryItem" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
CREATE TRIGGER "CreatureState_updated_at_trigger" BEFORE UPDATE ON "CreatureState" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
CREATE TRIGGER "DailyMission_updated_at_trigger" BEFORE UPDATE ON "DailyMission" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
CREATE TRIGGER "Device_updated_at_trigger" BEFORE UPDATE ON "Device" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
CREATE TRIGGER "Entry_updated_at_trigger" BEFORE UPDATE ON "Entry" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
CREATE TRIGGER "Feedback_updated_at_trigger" BEFORE UPDATE ON "Feedback" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
CREATE TRIGGER "PracticeCompletion_updated_at_trigger" BEFORE UPDATE ON "PracticeCompletion" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
CREATE TRIGGER "SyncCursor_updated_at_trigger" BEFORE UPDATE ON "SyncCursor" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
CREATE TRIGGER "TestResult_updated_at_trigger" BEFORE UPDATE ON "TestResult" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
CREATE TRIGGER "User_updated_at_trigger" BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
CREATE TRIGGER "UserPreference_updated_at_trigger" BEFORE UPDATE ON "UserPreference" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();