import { z } from 'zod';

const authEnvSchema = z.object({
  AUTH_SESSION_SECRET: z.string().min(32, 'AUTH_SESSION_SECRET must be at least 32 characters'),
  AUTH_SESSION_COOKIE: z.string().min(1).default('nexa_session'),
  AUTH_SESSION_TTL_DAYS: z.coerce.number().int().positive().default(14),
  AUTH_COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

let cached: AuthEnv | null = null;

export function getAuthConfig(): AuthEnv {
  if (cached) return cached;
  cached = authEnvSchema.parse(process.env);
  return cached;
}

export function getAppBaseUrl(): string {
  return getAuthConfig().NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
}
