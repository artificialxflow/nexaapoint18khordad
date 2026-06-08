import { getAuthConfig } from '@/src/lib/auth/config';
import { logSms } from '@/src/lib/logger';

export type SmsIrVerifyResponse = {
  status: number;
  message: string;
  data?: unknown;
};

export class SmsIrError extends Error {
  code = 'SMS_SEND_FAILED' as const;
  httpStatus?: number;
  smsStatus?: number;
  constructor(message: string, httpStatus?: number, smsStatus?: number) {
    super(message);
    this.name = 'SmsIrError';
    this.httpStatus = httpStatus;
    this.smsStatus = smsStatus;
  }
}

export async function sendVerifySms(mobileDisplay: string, code: string): Promise<void> {
  const cfg = getAuthConfig();

  if (cfg.SMS_IR_SANDBOX) {
    logSms.info('sandbox skip — SMS not sent', { mobile: mobileDisplay.replace(/\d(?=\d{4})/g, '*') });
    return;
  }

  const url = 'https://api.sms.ir/v1/send/verify';
  const body = {
    mobile: mobileDisplay,
    templateId: cfg.SMS_IR_TEMPLATE_ID,
    parameters: [{ name: cfg.SMS_IR_TEMPLATE_PARAM, value: code }],
  };

  logSms.debug('sending verify SMS', { templateId: cfg.SMS_IR_TEMPLATE_ID });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-API-KEY': cfg.SMS_IR_API_KEY,
    },
    body: JSON.stringify(body),
  });

  let payload: SmsIrVerifyResponse | null = null;
  try {
    payload = (await res.json()) as SmsIrVerifyResponse;
  } catch {
    payload = null;
  }

  logSms.info('verify SMS response', {
    httpStatus: res.status,
    smsStatus: payload?.status,
    message: payload?.message,
  });

  if (!res.ok || !payload || payload.status !== 1) {
    throw new SmsIrError(payload?.message ?? 'ارسال پیامک ناموفق بود', res.status, payload?.status);
  }
}
