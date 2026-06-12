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

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigError';
  }
}

let cached: AuthEnv | null = null;

function formatConfigIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.') || 'env';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}

export function getAuthConfig(): AuthEnv {
  if (cached) return cached;

  const parsed = authEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new AuthConfigError(
      `تنظیمات احراز هویت ناقص است (${formatConfigIssues(parsed.error)}). ` +
        'AUTH_SESSION_SECRET (حداقل ۳۲ کاراکتر) و AUTH_COOKIE_SECURE=false را در Coolify یا .env.production ست کنید.'
    );
  }

  let config = parsed.data;

  // HTTP deployments (sslip.io without TLS): Secure cookies are rejected by browsers.
  if (config.NEXT_PUBLIC_APP_URL.startsWith('http://')) {
    config = { ...config, AUTH_COOKIE_SECURE: false };
  }

  cached = config;
  return cached;
}

export function getAppBaseUrl(): string {
  return getAuthConfig().NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
}
