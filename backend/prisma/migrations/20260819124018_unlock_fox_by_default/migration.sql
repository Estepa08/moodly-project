-- AlterTable
ALTER TABLE "CreatureState" ALTER COLUMN "unlockedPetTypes" SET DEFAULT ARRAY['puff', 'fox']::TEXT[];

-- Backfill: unlock the fox companion for existing users too, not just new signups.
UPDATE "CreatureState"
SET "unlockedPetTypes" = array_append("unlockedPetTypes", 'fox')
WHERE NOT ('fox' = ANY("unlockedPetTypes"));
