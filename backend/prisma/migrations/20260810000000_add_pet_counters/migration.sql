-- AlterTable
ALTER TABLE "CreatureState" ADD COLUMN     "lastPetAt" TIMESTAMP(3),
ADD COLUMN     "petCount" INTEGER NOT NULL DEFAULT 0;