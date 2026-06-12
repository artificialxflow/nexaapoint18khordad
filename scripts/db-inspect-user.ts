/**
 * Inspect User table columns on a DATABASE_URL.
 * Usage: DATABASE_URL=... npx tsx scripts/db-inspect-user.ts
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

async function main() {
  console.log('[db-inspect] target:', url.replace(/:([^:@/]+)@/, ':***@'));

  const cols = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User'
    ORDER BY column_name
  `;
  console.log('[db-inspect] User columns:', cols.map((c) => c.column_name).join(', '));

  const hasPreset = cols.some((c) => c.column_name === 'accessLevelPreset');
  console.log('[db-inspect] accessLevelPreset:', hasPreset ? 'YES' : 'NO');

  const business = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'Business'
    ) AS exists
  `;
  console.log('[db-inspect] Business table:', business[0]?.exists ? 'YES' : 'NO');

  const migrations = await prisma.$queryRaw<{ migration_name: string; finished_at: Date | null }[]>`
    SELECT migration_name, finished_at FROM "_prisma_migrations"
    ORDER BY finished_at DESC NULLS LAST
  `;
  console.log('[db-inspect] migrations:');
  for (const m of migrations) {
    console.log(`  - ${m.migration_name} (${m.finished_at ?? 'pending'})`);
  }
}

main()
  .catch((e) => {
    console.error('[db-inspect] ERROR:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
