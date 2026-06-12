/**
 * Run prisma migrate deploy against nexapointdb (public port 3000).
 * Usage: npm run db:deploy:production
 */

import { execSync } from 'child_process';
import { loadProjectEnv } from './load-env';

loadProjectEnv();

const host = process.env.NEXAPOINT_DB_HOST ?? '91.107.177.182';
const port = process.env.NEXAPOINT_DB_PORT ?? '3000';
const user = process.env.NEXAPOINT_DB_USER ?? 'postgres';
const db = process.env.NEXAPOINT_DB_NAME ?? 'postgres';

const match = process.env.DATABASE_URL?.match(/postgres:\/\/([^:]+):([^@]+)@/);
if (!match) {
  console.error('[db-deploy:production] DATABASE_URL missing in .env');
  process.exit(1);
}

const password = decodeURIComponent(match[2]);
const url = `postgres://${user}:${encodeURIComponent(password)}@${host}:${port}/${db}`;

console.log(`[db-deploy:production] target=${host}:${port}/${db}`);
process.env.DATABASE_URL = url;
process.env.DIRECT_URL = url;

execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
