-- AlterTable
ALTER TABLE "User" ADD COLUMN     "wrappedKey" TEXT,
ADD COLUMN     "keySalt" TEXT,
ADD COLUMN     "recoveryWrappedKey" TEXT,
ADD COLUMN     "recoverySalt" TEXT;

-- AlterTable
ALTER TABLE "Entry" ALTER COLUMN "value" DROP NOT NULL,
ADD COLUMN     "encryptedData" TEXT;

-- AlterTable
ALTER TABLE "TestResult" ALTER COLUMN "score" DROP NOT NULL,
ALTER COLUMN "interpretation" DROP NOT NULL,
ALTER COLUMN "recommendation" DROP NOT NULL,
ADD COLUMN     "encryptedData" TEXT;

-- AlterTable
ALTER TABLE "CreatureState" ADD COLUMN     "petMood" TEXT;
