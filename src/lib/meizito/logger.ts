import { createLogger } from '@/src/lib/logger';

export const meizitoLog = createLogger('meizito');

export function meizitoModuleLog(module: string) {
  return createLogger(`meizito/${module}`);
}
