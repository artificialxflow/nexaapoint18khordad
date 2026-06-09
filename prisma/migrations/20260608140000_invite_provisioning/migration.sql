-- CreateEnum
CREATE TYPE "InviteCredentialMode" AS ENUM ('self', 'manual', 'auto');

-- AlterTable
ALTER TABLE "InviteToken" ADD COLUMN "displayName" TEXT,
ADD COLUMN "credentialMode" "InviteCredentialMode" NOT NULL DEFAULT 'self',
ADD COLUMN "presetUsername" TEXT,
ADD COLUMN "presetPasswordHash" TEXT;
