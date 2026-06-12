/**
 * Compare nexapointdb schema on external ports (5432 vs 3000).
 * Usage: npx tsx scripts/db-check-columns.ts
 */

import { PrismaClient } from '@prisma/client';
import { loadProjectEnv } from './load-env';

loadProjectEnv();

const PASSWORD = process.env.DB_CHECK_PASSWORD ?? process.env.DATABASE_URL?.match(/:(.+?)@/)?.[1];
const HOST = process.env.DB_CHECK_HOST ?? '91.107.177.182';
const USER = 'postgres';
const DB = 'postgres';

function url(port: number) {
  if (!PASSWORD) throw new Error('Set DATABASE_URL in .env or DB_CHECK_PASSWORD');
  return `postgres://${USER}:${encodeURIComponent(PASSWORD)}@${HOST}:${port}/${DB}`;
}

async function check(label: string, connectionString: string) {
  const prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });
  try {
    const rows = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'accessLevelPreset'
    `;
    const migrations = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations" ORDER BY finished_at DESC NULLS LAST LIMIT 5
    `;
    console.log(`[${label}] accessLevelPreset=${rows.length > 0 ? 'YES' : 'NO'}`);
    console.log(`[${label}] recent migrations:`, migrations.map((m) => m.migration_name).join(', ') || '(none)');
    return rows.length > 0;
  } catch (e) {
    console.log(`[${label}] ERROR:`, e instanceof Error ? e.message : String(e));
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('\n[db-check] comparing external DB ports\n');
  await check('port-5432', url(5432));
  await check('port-3000', url(3000));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
