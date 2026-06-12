-- CreateEnum
CREATE TYPE "InternalRequestStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "InternalRequestPriority" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "InternalRequest" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "status" "InternalRequestStatus" NOT NULL DEFAULT 'open',
    "priority" "InternalRequestPriority" NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL DEFAULT '',
    "authorUserId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "referredToUserIds" JSONB NOT NULL DEFAULT '[]',
    "referredTo" JSONB NOT NULL DEFAULT '[]',
    "ccUserIds" JSONB NOT NULL DEFAULT '[]',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "threadId" TEXT,
    "replyToRequestId" TEXT,
    "sourceChatMessageId" TEXT,
    "approvalState" "MeizitoApprovalState" NOT NULL DEFAULT 'draft',
    "currentAssigneeUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeizitoApprovalStep" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "MeizitoApprovalAction" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "assigneeUserId" TEXT,
    "comment" TEXT,
    "forwardedToIds" JSONB NOT NULL DEFAULT '[]',
    "forwardedToNames" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeizitoApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InternalRequest_businessId_idx" ON "InternalRequest"("businessId");

-- CreateIndex
CREATE INDEX "InternalRequest_businessId_status_idx" ON "InternalRequest"("businessId", "status");

-- CreateIndex
CREATE INDEX "InternalRequest_authorUserId_idx" ON "InternalRequest"("authorUserId");

-- CreateIndex
CREATE INDEX "InternalRequest_currentAssigneeUserId_idx" ON "InternalRequest"("currentAssigneeUserId");

-- CreateIndex
CREATE INDEX "InternalRequest_approvalState_idx" ON "InternalRequest"("approvalState");

-- CreateIndex
CREATE INDEX "MeizitoApprovalStep_businessId_entityType_entityId_idx" ON "MeizitoApprovalStep"("businessId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "MeizitoApprovalStep_businessId_assigneeUserId_idx" ON "MeizitoApprovalStep"("businessId", "assigneeUserId");

-- CreateIndex
CREATE INDEX "MeizitoApprovalStep_entityType_entityId_idx" ON "MeizitoApprovalStep"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "InternalRequest" ADD CONSTRAINT "InternalRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
