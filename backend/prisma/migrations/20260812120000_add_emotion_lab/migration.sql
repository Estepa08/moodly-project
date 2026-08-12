-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmotionLabProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyAttemptsUsed" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptDate" TIMESTAMP(3),
    "discoveredDyads" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmotionLabProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmotionLabProgress_userId_key" ON "EmotionLabProgress"("userId");

-- AddForeignKey
ALTER TABLE "EmotionLabProgress" ADD CONSTRAINT "EmotionLabProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep "updatedAt" in sync on every UPDATE, mirrors the trigger created in
-- 20260803100000_offline_sync_phase0 for all other tables. The function may be
-- missing on drifted dev DBs: CREATE OR REPLACE is idempotent (identical body).
CREATE OR REPLACE FUNCTION "set_updated_at"() RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "EmotionLabProgress_updated_at_trigger" BEFORE UPDATE ON "EmotionLabProgress" FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
