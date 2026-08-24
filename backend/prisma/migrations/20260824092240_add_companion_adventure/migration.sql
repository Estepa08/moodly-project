-- AlterTable
ALTER TABLE "CreatureState" ADD COLUMN     "adventureNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adventureReturnAt" TIMESTAMP(3);
