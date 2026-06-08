import type { SessionUser } from '@/src/lib/auth/session';

export function isSuperAdmin(user: SessionUser | null | undefined): boolean {
  return user?.systemRole.key === 'super_admin';
}

export function hasPermission(user: SessionUser | null | undefined, permission: string): boolean {
  if (!user) return false;
  const perms = user.systemRole.permissions;
  if (!Array.isArray(perms)) return false;
  if (perms.includes('all')) return true;
  return perms.includes(permission);
}

export function serializeAuthUser(user: SessionUser) {
  const perms = user.systemRole.permissions;
  return {
    id: user.id,
    displayName: user.displayName,
    mobile: user.mobile,
    mobileDisplay: `0${user.mobile}`,
    status: user.status,
    role: {
      key: user.systemRole.key,
      nameFa: user.systemRole.nameFa,
      permissions: Array.isArray(perms) ? perms : [],
    },
  };
}

export type SerializedAuthUser = ReturnType<typeof serializeAuthUser>;
