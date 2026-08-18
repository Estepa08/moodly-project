-- AlterTable
ALTER TABLE "CreatureState" ADD COLUMN     "lastPlayAt" TIMESTAMP(3),
ADD COLUMN     "playCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weeklyClaimWeek" TEXT;
