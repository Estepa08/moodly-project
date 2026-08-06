-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN     "afternoonReminder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "afternoonTime" TEXT DEFAULT '14:00',
ADD COLUMN     "eveningReminder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "eveningTime" TEXT DEFAULT '20:00';

-- CreateTable
CREATE TABLE "MotivationMessage" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "question" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MotivationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MotivationMessage_type_locale_isActive_idx" ON "MotivationMessage"("type", "locale", "isActive");
