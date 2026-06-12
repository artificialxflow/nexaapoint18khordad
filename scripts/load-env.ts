import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/** Load .env then .env.local (local overrides). Skips missing files and existing process.env keys. */
export function loadProjectEnv(cwd = process.cwd()): void {
  for (const file of ['.env', '.env.local']) {
    const path = join(cwd, file);
    if (!existsSync(path)) continue;

    const content = readFileSync(path, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const eq = line.indexOf('=');
      if (eq <= 0) continue;

      const key = line.slice(0, eq).trim();
      if (!key || process.env[key] !== undefined) continue;

      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}
