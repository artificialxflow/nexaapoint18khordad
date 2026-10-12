/**
 * Local: npm run db:preflight — loads .env / .env.local then runs docker/preflight.js
 */
import { spawnSync } from 'child_process';
import { join } from 'path';
import { loadProjectEnv } from './load-env';

loadProjectEnv();

const script = join(process.cwd(), 'docker', 'preflight.js');
const r = spawnSync(process.execPath, [script], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(r.status ?? 1);
