-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN     "afternoonMode" TEXT NOT NULL DEFAULT 'exact',
ADD COLUMN     "afternoonWindowEnd" TEXT DEFAULT '17:00',
ADD COLUMN     "afternoonWindowStart" TEXT DEFAULT '14:00',
ADD COLUMN     "eveningMode" TEXT NOT NULL DEFAULT 'exact',
ADD COLUMN     "eveningWindowEnd" TEXT DEFAULT '23:00',
ADD COLUMN     "eveningWindowStart" TEXT DEFAULT '20:00',
ADD COLUMN     "reminderMode" TEXT NOT NULL DEFAULT 'exact',
ADD COLUMN     "reminderWindowEnd" TEXT DEFAULT '12:00',
ADD COLUMN     "reminderWindowStart" TEXT DEFAULT '09:00';
