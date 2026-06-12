/**
 * Fetch Coolify deployment logs into logs/coolify-latest.log
 *
 * Env (.env or .env.local):
 *   COOLIFY_BASE_URL=http://91.107.177.182:8000
 *   COOLIFY_API_TOKEN=<from Coolify Keys & Tokens>
 *   COOLIFY_APP_UUID=<application uuid from Coolify URL>
 *
 * Usage:
 *   npm run coolify:logs              # latest deployment once
 *   npm run coolify:logs:watch        # poll until finished/failed
 *   npm run coolify:logs -- --status  # print status only
 *   (aliases: logs:coolify, logs:coolify:watch)
 */

import { appendFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { loadProjectEnv } from './load-env';

loadProjectEnv();

const BASE = (process.env.COOLIFY_BASE_URL ?? 'http://91.107.177.182:8000').replace(/\/$/, '');
const TOKEN = process.env.COOLIFY_API_TOKEN ?? '';
const APP_UUID = process.env.COOLIFY_APP_UUID ?? '';
const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'coolify-latest.log');
const META_FILE = join(LOG_DIR, 'coolify-latest.meta.json');

const POLL_MS = Number(process.env.COOLIFY_POLL_MS ?? 15_000);
const TIMEOUT_MS = Number(process.env.COOLIFY_POLL_TIMEOUT_MS ?? 600_000);

type Deployment = {
  deployment_uuid?: string;
  uuid?: string;
  status?: string;
  commit?: string;
  logs?: string;
  application_id?: string;
  application_name?: string;
  created_at?: string;
  updated_at?: string;
};

const args = new Set(process.argv.slice(2));
const watch = args.has('--watch') || args.has('-w');
const statusOnly = args.has('--status');

function requireEnv() {
  if (!TOKEN) {
    console.error('[coolify-log] Missing COOLIFY_API_TOKEN in .env or .env.local');
    console.error('  Coolify → Keys & Tokens → Create API token');
    process.exit(1);
  }
  if (!APP_UUID) {
    console.error('[coolify-log] Missing COOLIFY_APP_UUID in .env or .env.local');
    console.error('  Open your app in Coolify — UUID is in the browser URL');
    process.exit(1);
  }
}

async function api<T>(path: string): Promise<T> {
  const url = `${BASE}/api/v1${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/json',
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Coolify API ${path} → ${res.status}: ${text.slice(0, 500)}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function deploymentId(d: Deployment): string {
  return d.deployment_uuid ?? d.uuid ?? '';
}

function isTerminal(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return ['finished', 'success', 'failed', 'cancelled', 'canceled', 'error'].some((x) =>
    s.includes(x)
  );
}

async function listDeployments(): Promise<Deployment[]> {
  const paths = [
    `/deployments/applications/${APP_UUID}?take=10`,
    `/applications/${APP_UUID}/deployments?take=10`,
    `/applications/${APP_UUID}/deployments`,
  ];
  for (const path of paths) {
    try {
      const data = await api<
        Deployment[] | { data?: Deployment[]; deployments?: Deployment[]; count?: number }
      >(path);
      const list = Array.isArray(data)
        ? data
        : (data.deployments ?? data.data ?? []);
      if (list.length > 0) return list;
    } catch {
      /* try next path */
    }
  }

  try {
    const running = await api<Deployment[] | { deployments?: Deployment[] }>('/deployments');
    const list = Array.isArray(running) ? running : (running.deployments ?? []);
    return list.filter(
      (d) => d.application_id === APP_UUID || d.application_name?.includes('nexaapoint')
    );
  } catch {
    return [];
  }
}

async function getDeployment(uuid: string): Promise<Deployment> {
  return api<Deployment>(`/deployments/${uuid}`);
}

async function fetchApplicationRuntimeLogs(lines = 500): Promise<string | null> {
  try {
    const data = await api<{ logs?: string }>(`/applications/${APP_UUID}/logs?lines=${lines}`);
    const text = data.logs?.trim();
    return text || null;
  } catch {
    return null;
  }
}

async function resolveLogBody(deployment: Deployment): Promise<string> {
  const deployLogs = deployment.logs?.trim();
  if (deployLogs) return deployLogs;

  const runtime = await fetchApplicationRuntimeLogs();
  if (runtime) {
    return [
      '# Deploy build log was empty in Coolify API.',
      '# Showing runtime application logs (container stdout) instead:',
      '',
      runtime,
    ].join('\n');
  }

  return '(no deploy or runtime logs available from Coolify API)';
}

async function latestDeployment(): Promise<Deployment | null> {
  const list = await listDeployments();
  if (list.length === 0) return null;
  list.sort((a, b) => {
    const ta = Date.parse(a.updated_at ?? a.created_at ?? '') || 0;
    const tb = Date.parse(b.updated_at ?? b.created_at ?? '') || 0;
    return tb - ta;
  });
  const top = list[0];
  const id = deploymentId(top);
  if (!id) return top;
  try {
    return await getDeployment(id);
  } catch {
    return top;
  }
}

async function writeLog(deployment: Deployment) {
  mkdirSync(LOG_DIR, { recursive: true });
  const id = deploymentId(deployment);
  const body = await resolveLogBody(deployment);
  const header = [
    `# Coolify deployment log`,
    `# fetched: ${new Date().toISOString()}`,
    `# app: ${APP_UUID}`,
    `# deployment: ${id}`,
    `# status: ${deployment.status ?? 'unknown'}`,
    `# commit: ${deployment.commit ?? 'n/a'}`,
    `# base: ${BASE}`,
    '',
  ].join('\n');

  writeFileSync(LOG_FILE, header + body, 'utf8');
  writeFileSync(
    META_FILE,
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        deploymentUuid: id,
        status: deployment.status,
        commit: deployment.commit,
        logFile: LOG_FILE,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`[coolify-log] saved → ${LOG_FILE}`);
  console.log(`[coolify-log] status=${deployment.status ?? 'unknown'} commit=${deployment.commit ?? 'n/a'}`);
}

async function pollUntilDone(): Promise<Deployment> {
  const start = Date.now();
  let lastId = '';

  while (Date.now() - start < TIMEOUT_MS) {
    const dep = await latestDeployment();
    if (!dep) {
      console.log('[coolify-log] no deployment found yet, waiting…');
      await sleep(POLL_MS);
      continue;
    }

    const id = deploymentId(dep);
    if (id !== lastId) {
      lastId = id;
      console.log(`[coolify-log] tracking deployment ${id} status=${dep.status ?? 'unknown'}`);
    }

    const full = id ? await getDeployment(id).catch(() => dep) : dep;

    if (statusOnly) {
      console.log(full.status ?? 'unknown');
      if (isTerminal(full.status)) return full;
    } else if (isTerminal(full.status)) {
      await writeLog(full);
      return full;
    } else {
      console.log(`[coolify-log] still running (${full.status ?? 'in_progress'})…`);
    }

    await sleep(POLL_MS);
  }

  throw new Error(`[coolify-log] timeout after ${TIMEOUT_MS / 1000}s`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  requireEnv();
  console.log(`[coolify-log] base=${BASE} app=${APP_UUID}`);

  if (watch) {
    const dep = await pollUntilDone();
    if (dep.status?.toLowerCase().includes('fail')) {
      process.exitCode = 1;
    }
    return;
  }

  const dep = await latestDeployment();
  if (!dep) {
    console.error('[coolify-log] no deployments found for this application');
    process.exit(1);
  }

  const id = deploymentId(dep);
  const full = id ? await getDeployment(id).catch(() => dep) : dep;

  if (statusOnly) {
    console.log(full.status ?? 'unknown');
    return;
  }

  await writeLog(full);

  if (full.status?.toLowerCase().includes('fail')) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(String(err));
  mkdirSync(LOG_DIR, { recursive: true });
  appendFileSync(
    join(LOG_DIR, 'coolify-error.log'),
    `${new Date().toISOString()} ${String(err)}\n`,
    { flag: 'a' }
  );
  process.exit(1);
});
