import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { getAuthConfig } from '@/src/lib/auth/config';
import { normalizeMobile, mobilesMatch } from '@/src/lib/auth/mobile';
import { prisma } from '@/src/lib/db/prisma';
import { logOtp, maskMobile } from '@/src/lib/logger';
import { sendVerifySms } from '@/src/lib/sms/smsIrClient';

export class OtpError extends Error {
  constructor(
    public code:
      | 'OTP_EXPIRED'
      | 'OTP_INVALID'
      | 'OTP_MAX_ATTEMPTS'
      | 'OTP_RESEND_TOO_SOON'
      | 'OTP_NOT_FOUND',
    message: string
  ) {
    super(message);
    this.name = 'OtpError';
  }
}

function hashOtp(code: string): string {
  const secret = getAuthConfig().OTP_SIGNING_SECRET;
  return createHash('sha256').update(`${secret}:${code}`).digest('hex');
}

function verifyOtpHash(code: string, hash: string): boolean {
  const expected = hashOtp(code);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
  } catch {
    return false;
  }
}

function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

export function isBootstrapLogin(mobileInput: string, code: string): boolean {
  const cfg = getAuthConfig();
  if (!cfg.ALLOW_BOOTSTRAP_OTP) return false;
  if (code !== cfg.BOOTSTRAP_OTP) return false;
  return mobilesMatch(mobileInput, cfg.BOOTSTRAP_MOBILE);
}

export async function createAndSendOtp(
  mobileInput: string,
  ip?: string | null,
  userAgent?: string | null
): Promise<{ resendAfterSeconds: number }> {
  const cfg = getAuthConfig();
  const { mobileE164, display } = normalizeMobile(mobileInput);
  const masked = maskMobile(display);

  const latest = await prisma.otpChallenge.findFirst({
    where: { mobileE164, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (latest && latest.resendAfter > new Date()) {
    const wait = Math.ceil((latest.resendAfter.getTime() - Date.now()) / 1000);
    logOtp.warn('resend too soon', { mobile: masked, waitSeconds: wait });
    throw new OtpError('OTP_RESEND_TOO_SOON', `لطفاً ${wait} ثانیه دیگر تلاش کنید`);
  }

  const code = generateOtpCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + cfg.OTP_TTL_SECONDS * 1000);
  const resendAfter = new Date(now.getTime() + cfg.OTP_RESEND_SECONDS * 1000);

  await prisma.otpChallenge.create({
    data: {
      mobileE164,
      codeHash: hashOtp(code),
      expiresAt,
      resendAfter,
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    },
  });

  await sendVerifySms(display, code);

  logOtp.info('challenge created', {
    mobile: masked,
    ttlSeconds: cfg.OTP_TTL_SECONDS,
    resendSeconds: cfg.OTP_RESEND_SECONDS,
  });

  return { resendAfterSeconds: cfg.OTP_RESEND_SECONDS };
}

export async function verifyOtpCode(mobileInput: string, code: string): Promise<void> {
  const cfg = getAuthConfig();
  const { mobileE164, display } = normalizeMobile(mobileInput);
  const masked = maskMobile(display);

  if (isBootstrapLogin(mobileInput, code)) {
    logOtp.info('bootstrap OTP accepted', { mobile: masked });
    return;
  }

  const challenge = await prisma.otpChallenge.findFirst({
    where: { mobileE164, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) {
    logOtp.warn('no active challenge', { mobile: masked });
    throw new OtpError('OTP_NOT_FOUND', 'کد منقضی شده — دوباره درخواست دهید');
  }

  if (challenge.expiresAt < new Date()) {
    logOtp.warn('challenge expired', { mobile: masked });
    throw new OtpError('OTP_EXPIRED', 'کد منقضی شده است');
  }

  if (challenge.attempts >= cfg.OTP_MAX_ATTEMPTS) {
    logOtp.warn('max attempts reached', { mobile: masked });
    throw new OtpError('OTP_MAX_ATTEMPTS', 'تعداد تلاش بیش از حد مجاز است');
  }

  const valid = verifyOtpHash(code, challenge.codeHash);
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { attempts: { increment: 1 } },
  });

  if (!valid) {
    logOtp.warn('invalid code', { mobile: masked, attempts: challenge.attempts + 1 });
    throw new OtpError('OTP_INVALID', 'کد وارد شده نادرست است');
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  logOtp.info('challenge verified', { mobile: masked });
}
