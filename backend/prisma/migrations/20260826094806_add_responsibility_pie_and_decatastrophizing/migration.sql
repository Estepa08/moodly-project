-- CreateTable
CREATE TABLE "ResponsibilityPieEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "situationText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ResponsibilityPieEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibilityPieFactor" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "percent" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ResponsibilityPieFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecatastrophizingEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "worstCaseText" TEXT NOT NULL,
    "copingPlanText" TEXT NOT NULL,
    "mostLikelyText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DecatastrophizingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResponsibilityPieEntry_userId_idx" ON "ResponsibilityPieEntry"("userId");

-- CreateIndex
CREATE INDEX "ResponsibilityPieEntry_userId_createdAt_idx" ON "ResponsibilityPieEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ResponsibilityPieFactor_entryId_idx" ON "ResponsibilityPieFactor"("entryId");

-- CreateIndex
CREATE INDEX "DecatastrophizingEntry_userId_idx" ON "DecatastrophizingEntry"("userId");

-- CreateIndex
CREATE INDEX "DecatastrophizingEntry_userId_createdAt_idx" ON "DecatastrophizingEntry"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ResponsibilityPieEntry" ADD CONSTRAINT "ResponsibilityPieEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityPieFactor" ADD CONSTRAINT "ResponsibilityPieFactor_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ResponsibilityPieEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecatastrophizingEntry" ADD CONSTRAINT "DecatastrophizingEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
