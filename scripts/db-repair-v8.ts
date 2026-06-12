/**
 * Idempotent repair for access_control_v8 objects missing despite migration record.
 * Usage: DATABASE_URL=... npm run db:repair:v8
 */

import { PrismaClient } from '@prisma/client';
import { loadProjectEnv } from './load-env';

loadProjectEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL required');
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url } } });

const STATEMENTS: string[] = [
  `DO $$ BEGIN
  CREATE TYPE "AccessLevelPreset" AS ENUM ('full', 'sales_only', 'finance_only', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accessLevelPreset" "AccessLevelPreset" NOT NULL DEFAULT 'custom'`,
  `CREATE TABLE IF NOT EXISTS "PermissionCatalog" (
    "id" TEXT NOT NULL, "key" TEXT NOT NULL, "labelFa" TEXT NOT NULL, "module" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0, "isSystem" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "PermissionCatalog_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "UserRestriction" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "ownSalesOnly" BOOLEAN NOT NULL DEFAULT false,
    "ownPurchaseOnly" BOOLEAN NOT NULL DEFAULT false, "timeWindowEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowedFrom" TEXT, "allowedTo" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserRestriction_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "BankAccount" (
    "id" TEXT NOT NULL, "nameFa" TEXT NOT NULL, "code" TEXT NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "UserBankAccess" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "bankAccountId" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserBankAccess_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
    "id" TEXT NOT NULL, "actorId" TEXT NOT NULL, "action" TEXT NOT NULL, "targetType" TEXT NOT NULL,
    "targetId" TEXT, "meta" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PermissionCatalog_key_key" ON "PermissionCatalog"("key")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "UserRestriction_userId_key" ON "UserRestriction"("userId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "BankAccount_code_key" ON "BankAccount"("code")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "UserBankAccess_userId_bankAccountId_key" ON "UserBankAccess"("userId", "bankAccountId")`,
  `CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorId_idx" ON "AdminAuditLog"("actorId")`,
  `CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt")`,
  `DO $$ BEGIN
  ALTER TABLE "UserRestriction" ADD CONSTRAINT "UserRestriction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$`,
  `DO $$ BEGIN
  ALTER TABLE "UserBankAccess" ADD CONSTRAINT "UserBankAccess_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$`,
  `DO $$ BEGIN
  ALTER TABLE "UserBankAccess" ADD CONSTRAINT "UserBankAccess_bankAccountId_fkey"
    FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$`,
  `DELETE FROM "AdminAuditLog" a WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = a."actorId")`,
  `DO $$ BEGIN
  ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$`,
];

async function main() {
  console.log('[db-repair-v8] applying idempotent v8 schema repair…');
  for (let i = 0; i < STATEMENTS.length; i++) {
    await prisma.$executeRawUnsafe(STATEMENTS[i]);
    console.log(`[db-repair-v8] step ${i + 1}/${STATEMENTS.length} ok`);
  }

  const cols = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'accessLevelPreset'
  `;
  console.log('[db-repair-v8] accessLevelPreset:', cols.length ? 'YES' : 'NO');
}

main()
  .catch((e) => {
    console.error('[db-repair-v8] ERROR:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
