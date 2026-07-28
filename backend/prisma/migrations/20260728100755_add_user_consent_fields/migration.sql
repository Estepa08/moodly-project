-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ageConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "consentVersion" TEXT;
