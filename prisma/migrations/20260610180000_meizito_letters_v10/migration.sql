-- CreateEnum
CREATE TYPE "InternalLetterStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "InternalLetterBox" AS ENUM ('inbox', 'outbox', 'archive');

-- CreateTable
CREATE TABLE "InternalLetter" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "to" JSONB NOT NULL DEFAULT '[]',
    "labels" JSONB NOT NULL DEFAULT '[]',
    "category" TEXT NOT NULL DEFAULT 'other',
    "status" "InternalLetterStatus" NOT NULL DEFAULT 'open',
    "box" "InternalLetterBox" NOT NULL DEFAULT 'outbox',
    "templateId" TEXT,
    "referredTo" JSONB NOT NULL DEFAULT '[]',
    "referredFrom" TEXT NOT NULL DEFAULT '',
    "authorUserId" TEXT NOT NULL,
    "replyToLetterId" TEXT,
    "threadId" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "approvalState" "MeizitoApprovalState" NOT NULL DEFAULT 'draft',
    "currentAssigneeUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InternalLetter_businessId_idx" ON "InternalLetter"("businessId");

-- CreateIndex
CREATE INDEX "InternalLetter_businessId_box_idx" ON "InternalLetter"("businessId", "box");

-- CreateIndex
CREATE INDEX "InternalLetter_businessId_status_idx" ON "InternalLetter"("businessId", "status");

-- CreateIndex
CREATE INDEX "InternalLetter_authorUserId_idx" ON "InternalLetter"("authorUserId");

-- CreateIndex
CREATE INDEX "InternalLetter_threadId_idx" ON "InternalLetter"("threadId");

-- CreateIndex
CREATE INDEX "InternalLetter_currentAssigneeUserId_idx" ON "InternalLetter"("currentAssigneeUserId");

-- CreateIndex
CREATE INDEX "InternalLetter_approvalState_idx" ON "InternalLetter"("approvalState");

-- AddForeignKey
ALTER TABLE "InternalLetter" ADD CONSTRAINT "InternalLetter_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
