-- CreateEnum
CREATE TYPE "MeizitoApprovalState" AS ENUM ('draft', 'pending', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "MeizitoApprovalAction" AS ENUM ('approve', 'reject', 'forward', 'comment', 'submit', 'cancel');

-- CreateEnum
CREATE TYPE "MeizitoMemberRole" AS ENUM ('member', 'manager', 'senior_manager');

-- CreateTable
CREATE TABLE "BusinessMemberProfile" (
    "memberId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "mobile" TEXT NOT NULL DEFAULT '',
    "extension" TEXT NOT NULL DEFAULT '',
    "managerUserId" TEXT,
    "meizitoRole" "MeizitoMemberRole" NOT NULL DEFAULT 'member',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessMemberProfile_pkey" PRIMARY KEY ("memberId")
);

-- CreateIndex
CREATE INDEX "BusinessMemberProfile_managerUserId_idx" ON "BusinessMemberProfile"("managerUserId");

-- CreateIndex
CREATE INDEX "BusinessMemberProfile_department_idx" ON "BusinessMemberProfile"("department");

-- AddForeignKey
ALTER TABLE "BusinessMemberProfile" ADD CONSTRAINT "BusinessMemberProfile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "BusinessMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMemberProfile" ADD CONSTRAINT "BusinessMemberProfile_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
