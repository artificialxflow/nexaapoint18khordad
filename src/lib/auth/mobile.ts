export type NormalizedMobile = {
  mobile: string;
  mobileE164: string;
  display: string;
};

export class MobileValidationError extends Error {
  code = 'MOBILE_INVALID' as const;
  constructor(message = 'شماره موبایل نامعتبر است') {
    super(message);
    this.name = 'MobileValidationError';
  }
}

export function normalizeMobile(input: string): NormalizedMobile {
  let digits = input.replace(/\D/g, '');

  if (digits.startsWith('98') && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0098') && digits.length === 14) {
    digits = digits.slice(4);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (!/^9\d{9}$/.test(digits)) {
    throw new MobileValidationError();
  }

  return {
    mobile: digits,
    mobileE164: `98${digits}`,
    display: `0${digits}`,
  };
}

export function mobilesMatch(a: string, b: string): boolean {
  try {
    return normalizeMobile(a).mobileE164 === normalizeMobile(b).mobileE164;
  } catch {
    return false;
  }
}
