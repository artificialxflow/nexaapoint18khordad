type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function currentLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') return raw;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[currentLevel()];
}

export function maskMobile(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 6) return '***';
  const local = digits.startsWith('98') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits;
  if (local.length < 6) return '***';
  return `0${local.slice(0, 4)}***${local.slice(-4)}`;
}

function formatMessage(prefix: string, message: string, meta?: Record<string, unknown>): string {
  const base = `${prefix} ${message}`;
  if (!meta || Object.keys(meta).length === 0) return base;
  return `${base} ${JSON.stringify(meta)}`;
}

function write(level: LogLevel, prefix: string, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const line = formatMessage(prefix, message, meta);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function createLogger(prefix: string) {
  return {
    debug: (message: string, meta?: Record<string, unknown>) => write('debug', prefix, message, meta),
    info: (message: string, meta?: Record<string, unknown>) => write('info', prefix, message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => write('warn', prefix, message, meta),
    error: (message: string, meta?: Record<string, unknown>) => write('error', prefix, message, meta),
  };
}

export const logAuth = createLogger('[auth]');
export const logOtp = createLogger('[otp]');
export const logSms = createLogger('[sms]');
export const logDb = createLogger('[db]');
export const logMiddleware = createLogger('[middleware]');
