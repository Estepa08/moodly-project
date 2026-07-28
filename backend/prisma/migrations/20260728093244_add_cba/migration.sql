-- CreateTable
CREATE TABLE "CbaExample" (
    "id" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "thoughtText" TEXT NOT NULL,
    "prosWeight" INTEGER NOT NULL,
    "consWeight" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CbaExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CbaExampleItem" (
    "id" TEXT NOT NULL,
    "exampleId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemText" TEXT NOT NULL,

    CONSTRAINT "CbaExampleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CbaExampleDistortion" (
    "id" TEXT NOT NULL,
    "exampleId" TEXT NOT NULL,
    "distortionKey" TEXT NOT NULL,

    CONSTRAINT "CbaExampleDistortion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CbaCommonItem" (
    "id" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemText" TEXT NOT NULL,

    CONSTRAINT "CbaCommonItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CbaEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "thoughtText" TEXT NOT NULL,
    "prosWeight" INTEGER NOT NULL,
    "consWeight" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CbaEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CbaEntryItem" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemText" TEXT NOT NULL,

    CONSTRAINT "CbaEntryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CbaExampleItem_exampleId_idx" ON "CbaExampleItem"("exampleId");

-- CreateIndex
CREATE INDEX "CbaExampleDistortion_exampleId_idx" ON "CbaExampleDistortion"("exampleId");

-- CreateIndex
CREATE INDEX "CbaEntry_userId_idx" ON "CbaEntry"("userId");

-- CreateIndex
CREATE INDEX "CbaEntryItem_entryId_idx" ON "CbaEntryItem"("entryId");

-- AddForeignKey
ALTER TABLE "CbaExampleItem" ADD CONSTRAINT "CbaExampleItem_exampleId_fkey" FOREIGN KEY ("exampleId") REFERENCES "CbaExample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CbaExampleDistortion" ADD CONSTRAINT "CbaExampleDistortion_exampleId_fkey" FOREIGN KEY ("exampleId") REFERENCES "CbaExample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CbaEntry" ADD CONSTRAINT "CbaEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CbaEntryItem" ADD CONSTRAINT "CbaEntryItem_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "CbaEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
