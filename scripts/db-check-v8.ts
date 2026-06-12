/**
 * Check which v8 objects exist on DATABASE_URL.
 */
import { PrismaClient } from '@prisma/client';
import { loadProjectEnv } from './load-env';

loadProjectEnv();
const url = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function tableExists(name: string) {
  const r = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${name}
    ) AS exists
  `;
  return r[0]?.exists ?? false;
}

async function enumExists(name: string) {
  const r = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = ${name}
    ) AS exists
  `;
  return r[0]?.exists ?? false;
}

async function main() {
  console.log('[v8-check]');
  console.log('  AccessLevelPreset enum:', await enumExists('AccessLevelPreset'));
  const presetCol = await prisma.$queryRaw<{ c: number }[]>`
    SELECT COUNT(*)::int AS c FROM information_schema.columns
    WHERE table_name='User' AND column_name='accessLevelPreset'
  `;
  console.log('  User.accessLevelPreset:', (presetCol[0]?.c ?? 0) === 1);
  console.log('  PermissionCatalog:', await tableExists('PermissionCatalog'));
  console.log('  UserRestriction:', await tableExists('UserRestriction'));
  console.log('  BankAccount:', await tableExists('BankAccount'));
  console.log('  UserBankAccess:', await tableExists('UserBankAccess'));
  console.log('  AdminAuditLog:', await tableExists('AdminAuditLog'));
}

main().finally(() => prisma.$disconnect());
