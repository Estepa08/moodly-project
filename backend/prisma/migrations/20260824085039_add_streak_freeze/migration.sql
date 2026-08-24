-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN     "streakFreezeReward" INTEGER;

-- AlterTable
ALTER TABLE "CreatureState" ADD COLUMN     "streakFreezeCount" INTEGER NOT NULL DEFAULT 0;
