import { z } from 'zod';
import { logAuth } from '@/src/lib/logger';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  SMS_IR_API_KEY: z.string().min(1),
  SMS_IR_TEMPLATE_ID: z.coerce.number().int().positive(),
  SMS_IR_SANDBOX: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  SMS_IR_TEMPLATE_PARAM: z.string().default('Code'),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(120),
  OTP_RESEND_SECONDS: z.coerce.number().int().positive().default(60),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_SIGNING_SECRET: z.string().min(16),
  AUTH_SESSION_COOKIE: z.string().default('nexa_session'),
  AUTH_SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  BOOTSTRAP_MOBILE: z.string().default('09126723365'),
  BOOTSTRAP_OTP: z.string().default('000000'),
  ALLOW_BOOTSTRAP_OTP: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type AuthConfig = z.infer<typeof envSchema>;

let cached: AuthConfig | null = null;

export function getAuthConfig(): AuthConfig {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`[auth] Invalid environment: ${issues}`);
  }
  cached = parsed.data;
  logAuth.info('config loaded', {
    sandbox: cached.SMS_IR_SANDBOX,
    bootstrapAllowed: cached.ALLOW_BOOTSTRAP_OTP,
  });
  return cached;
}

export function isProduction(): boolean {
  return getAuthConfig().NODE_ENV === 'production';
}
