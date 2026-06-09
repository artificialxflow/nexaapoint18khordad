export type AdminRoleRow = {
  id: string;
  slug: string;
  nameFa: string;
  level: number;
  isSystem?: boolean;
  permissions?: Record<string, boolean>;
  userCount?: number;
};

export type AdminUserRow = {
  id: string;
  username: string;
  displayName: string;
  status: 'active' | 'disabled';
  mustChangePassword?: boolean;
  accessLevelPreset?: string;
  systemRole: { id: string; slug: string; nameFa: string; level: number };
  lastLoginAt?: string | null;
};

export type AdminInviteRow = {
  id: string;
  role: { slug: string; nameFa: string };
  expiresAt: string;
  usedAt?: string | null;
  status: string;
  displayName?: string | null;
  credentialMode?: string;
};

export function formatLastLogin(iso: string | null | undefined): string {
  if (!iso) return 'هرگز';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return 'امروز';
  if (diff < 172800000) return 'دیروز';
  return d.toLocaleDateString('fa-IR');
}
