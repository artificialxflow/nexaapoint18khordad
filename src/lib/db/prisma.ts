import { PrismaClient } from '@prisma/client';
import { createLogger } from '@/src/lib/logger';

const log = createLogger('db');

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.LOG_LEVEL === 'debug' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDb() {
  try {
    await prisma.$connect();
  } catch (err) {
    log.error('connect failed', { error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}
