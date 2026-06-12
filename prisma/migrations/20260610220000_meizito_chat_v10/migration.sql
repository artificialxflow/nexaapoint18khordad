-- CreateEnum
CREATE TYPE "MeizitoThreadType" AS ENUM ('direct', 'group', 'channel');

-- CreateEnum
CREATE TYPE "MeizitoMessageType" AS ENUM ('text', 'file', 'voice', 'image', 'video');

-- CreateTable
CREATE TABLE "ChatThread" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "threadType" "MeizitoThreadType" NOT NULL DEFAULT 'direct',
    "participantNames" JSONB NOT NULL DEFAULT '[]',
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorUserId" TEXT,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "type" "MeizitoMessageType" NOT NULL DEFAULT 'text',
    "attachmentNames" JSONB NOT NULL DEFAULT '[]',
    "attachmentRefs" JSONB NOT NULL DEFAULT '[]',
    "voiceDurationSec" INTEGER,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatThread_businessId_idx" ON "ChatThread"("businessId");

-- CreateIndex
CREATE INDEX "ChatThread_businessId_threadType_idx" ON "ChatThread"("businessId", "threadType");

-- CreateIndex
CREATE INDEX "ChatMessage_businessId_idx" ON "ChatMessage"("businessId");

-- CreateIndex
CREATE INDEX "ChatMessage_businessId_threadId_idx" ON "ChatMessage"("businessId", "threadId");

-- CreateIndex
CREATE INDEX "ChatMessage_threadId_idx" ON "ChatMessage"("threadId");

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
