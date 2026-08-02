-- AlterTable
ALTER TABLE "CreatureState" ADD COLUMN     "feedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "feedCounts" JSONB NOT NULL DEFAULT '{}';
