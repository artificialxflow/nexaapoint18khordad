import { prisma } from '@/src/lib/db/prisma';

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
    include: { systemRole: true },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { systemRole: true },
  });
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  const normalized = normalizeUsername(username);
  if (normalized.length < 3 || normalized.length > 32) {
    return 'نام کاربری باید بین ۳ تا ۳۲ کاراکتر باشد.';
  }
  if (!/^[a-z0-9._-]+$/.test(normalized)) {
    return 'نام کاربری فقط حروف انگلیسی کوچک، عدد، نقطه، خط تیره و زیرخط مجاز است.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
  return null;
}
