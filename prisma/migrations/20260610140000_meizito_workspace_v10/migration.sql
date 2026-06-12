-- CreateEnum
CREATE TYPE "DailyReportStatus" AS ENUM ('draft', 'submitted');

-- CreateEnum
CREATE TYPE "MeizitoRecurrenceKind" AS ENUM ('none', 'daily', 'weekly');

-- CreateTable
CREATE TABLE "WorkspaceBoard" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memberNames" JSONB NOT NULL DEFAULT '[]',
    "labelPalette" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceColumn" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "cardIds" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "WorkspaceColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceCard" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "labelIds" JSONB NOT NULL DEFAULT '[]',
    "category" TEXT NOT NULL DEFAULT '',
    "assigneeUserId" TEXT,
    "assignee" TEXT NOT NULL DEFAULT '',
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "dueDate" TEXT NOT NULL DEFAULT '',
    "dueTime" TEXT NOT NULL DEFAULT '',
    "recurrence" "MeizitoRecurrenceKind" NOT NULL DEFAULT 'none',
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceProject" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "boardId" TEXT,
    "ncFolderPath" TEXT,
    "memberIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteBoard" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#94a3b8',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NoteBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceNote" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#fef08a',
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "ncAttachments" JSONB NOT NULL DEFAULT '[]',
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "status" "DailyReportStatus" NOT NULL DEFAULT 'draft',
    "managerApproved" BOOLEAN NOT NULL DEFAULT false,
    "managerApprovedAt" TIMESTAMP(3),
    "feedbackEntries" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldVisit" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceBoard_businessId_idx" ON "WorkspaceBoard"("businessId");

-- CreateIndex
CREATE INDEX "WorkspaceColumn_boardId_idx" ON "WorkspaceColumn"("boardId");

-- CreateIndex
CREATE INDEX "WorkspaceCard_businessId_idx" ON "WorkspaceCard"("businessId");

-- CreateIndex
CREATE INDEX "WorkspaceCard_boardId_idx" ON "WorkspaceCard"("boardId");

-- CreateIndex
CREATE INDEX "WorkspaceCard_columnId_idx" ON "WorkspaceCard"("columnId");

-- CreateIndex
CREATE INDEX "WorkspaceProject_businessId_idx" ON "WorkspaceProject"("businessId");

-- CreateIndex
CREATE INDEX "NoteBoard_businessId_idx" ON "NoteBoard"("businessId");

-- CreateIndex
CREATE INDEX "WorkspaceNote_businessId_idx" ON "WorkspaceNote"("businessId");

-- CreateIndex
CREATE INDEX "WorkspaceNote_boardId_idx" ON "WorkspaceNote"("boardId");

-- CreateIndex
CREATE INDEX "DailyReport_businessId_dateKey_idx" ON "DailyReport"("businessId", "dateKey");

-- CreateIndex
CREATE INDEX "DailyReport_authorUserId_idx" ON "DailyReport"("authorUserId");

-- CreateIndex
CREATE INDEX "FieldVisit_businessId_dateKey_idx" ON "FieldVisit"("businessId", "dateKey");

-- AddForeignKey
ALTER TABLE "WorkspaceBoard" ADD CONSTRAINT "WorkspaceBoard_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceColumn" ADD CONSTRAINT "WorkspaceColumn_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "WorkspaceBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceCard" ADD CONSTRAINT "WorkspaceCard_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceCard" ADD CONSTRAINT "WorkspaceCard_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "WorkspaceBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceProject" ADD CONSTRAINT "WorkspaceProject_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteBoard" ADD CONSTRAINT "NoteBoard_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceNote" ADD CONSTRAINT "WorkspaceNote_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldVisit" ADD CONSTRAINT "FieldVisit_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
