-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "pdpConsent" BOOLEAN NOT NULL DEFAULT false;
