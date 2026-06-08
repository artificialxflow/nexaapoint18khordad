import { prisma } from '@/src/lib/db/prisma';
import { normalizeMobile } from '@/src/lib/auth/mobile';
import { logAuth } from '@/src/lib/logger';

export async function findUserByMobile(mobileInput: string) {
  const { mobile, mobileE164 } = normalizeMobile(mobileInput);
  return prisma.user.findFirst({
    where: { OR: [{ mobile }, { mobileE164 }] },
    include: { systemRole: true },
  });
}

export async function requireExistingUser(mobileInput: string) {
  const user = await findUserByMobile(mobileInput);
  if (!user) {
    logAuth.warn('user not found for mobile');
    return null;
  }
  return user;
}
