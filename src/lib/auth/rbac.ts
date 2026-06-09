import type { SystemRole, User } from '@prisma/client';

export type PermissionMap = Record<string, boolean>;

export function getPermissions(role: SystemRole): PermissionMap {
  if (!role.permissions || typeof role.permissions !== 'object') return {};
  return role.permissions as PermissionMap;
}

export function isSuperAdmin(role: SystemRole): boolean {
  return role.slug === 'super_admin';
}

export function hasPermission(role: SystemRole, permission: string): boolean {
  if (isSuperAdmin(role)) return true;
  const perms = getPermissions(role);
  return Boolean(perms[permission]);
}

export function canAssignRole(actorRole: SystemRole, targetRole: SystemRole): boolean {
  if (isSuperAdmin(actorRole)) return true;
  if (targetRole.slug === 'super_admin') return false;
  if (!hasPermission(actorRole, 'users:write')) return false;
  return targetRole.level < actorRole.level;
}

export function canManageUser(actorRole: SystemRole, targetRole: SystemRole): boolean {
  if (isSuperAdmin(actorRole)) return true;
  if (targetRole.slug === 'super_admin') return false;
  if (!hasPermission(actorRole, 'users:write')) return false;
  return targetRole.level < actorRole.level;
}

export type AuthUserPayload = {
  id: string;
  username: string;
  displayName: string;
  status: User['status'];
  mustChangePassword: boolean;
  systemRole: {
    id: string;
    slug: string;
    nameFa: string;
    level: number;
    permissions: PermissionMap;
  };
};

export function serializeAuthUser(user: User & { systemRole: SystemRole }): AuthUserPayload {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    systemRole: {
      id: user.systemRole.id,
      slug: user.systemRole.slug,
      nameFa: user.systemRole.nameFa,
      level: user.systemRole.level,
      permissions: getPermissions(user.systemRole),
    },
  };
}
