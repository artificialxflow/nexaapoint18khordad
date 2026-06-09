'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyRound,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  UserCog,
  UserX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import AdminToast, { useAdminToast } from '@/src/components/admin/AdminToast';
import ConfirmDialog from '@/src/components/admin/ConfirmDialog';
import ResetPasswordModal from '@/src/components/admin/ResetPasswordModal';
import EditUserModal from '@/src/components/admin/EditUserModal';
import UserFormModal from '@/src/components/admin/UserFormModal';
import CredentialsRevealModal from '@/src/components/admin/CredentialsRevealModal';
import InviteLinkModal from '@/src/components/admin/InviteLinkModal';
import type { AdminInviteRow, AdminRoleRow, AdminUserRow } from '@/src/views/settings/access/types';
import { formatLastLogin } from '@/src/views/settings/access/types';

type UsersTabProps = {
  innerTab: 'users' | 'roles';
  onInnerTabChange: (tab: 'users' | 'roles') => void;
  rolesSlot: React.ReactNode;
};

export default function UsersTab({ innerTab, onInnerTabChange, rolesSlot }: UsersTabProps) {
  const { user: me } = useAuth();
  const { message, error, toast, dismiss } = useAdminToast();
  const canWrite = Boolean(me?.systemRole.permissions['users:write'] || me?.systemRole.slug === 'super_admin');
  const canInvite = Boolean(me?.systemRole.permissions['invites:write'] || me?.systemRole.slug === 'super_admin');

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [roles, setRoles] = useState<AdminRoleRow[]>([]);
  const [invites, setInvites] = useState<AdminInviteRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [resetUser, setResetUser] = useState<AdminUserRow | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<AdminUserRow | null>(null);
  const [revokeInviteId, setRevokeInviteId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const assignableRoles = roles.filter((r) => {
    if (!me) return false;
    if (me.systemRole.slug === 'super_admin') return true;
    return r.level < me.systemRole.level && r.slug !== 'super_admin';
  });

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setInitialLoading(true);
      else setRefreshing(true);
      try {
        const [usersRes, invitesRes] = await Promise.all([
          fetch('/api/admin/users', { credentials: 'include' }),
          canInvite ? fetch('/api/admin/invites', { credentials: 'include' }) : Promise.resolve(null),
        ]);
        const usersJson = await usersRes.json();
        if (!usersRes.ok) throw new Error(usersJson.error?.message ?? 'خطا');
        setUsers(usersJson.data.users);
        setRoles(usersJson.data.roles);
        if (invitesRes) {
          const ij = await invitesRes.json();
          if (invitesRes.ok) setInvites(ij.data.invites);
        }
      } catch (e) {
        toast(e instanceof Error ? e.message : 'خطا', true);
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [canInvite, toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.trim();
      const matchQ =
        !q || u.displayName.includes(q) || u.username.includes(q.toLowerCase());
      const matchS = statusFilter === 'all' || u.status === statusFilter;
      return matchQ && matchS;
    });
  }, [users, searchQuery, statusFilter]);

  const handleProvision = async (data: Parameters<NonNullable<React.ComponentProps<typeof UserFormModal>['onSubmit']>>[0]) => {
    const res = await fetch('/api/admin/users/provision', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, expiresInDays: 7 }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? 'خطا');
    if (json.data.credentials) setCredentials(json.data.credentials);
    if (json.data.invite?.url) setInviteUrl(json.data.invite.url);
    toast(data.delivery === 'invite' ? 'لینک دعوت ساخته شد.' : 'کاربر ساخته شد.');
    load(true);
  };

  const handleEdit = async (data: { displayName: string; systemRoleId: string; mustChangePassword: boolean }) => {
    if (!editUser) return;
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? 'خطا');
    toast('کاربر بروزرسانی شد.');
    load(true);
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetUser) return;
    const res = await fetch(`/api/admin/users/${resetUser.id}/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? 'خطا');
    toast('رمز عبور بروزرسانی شد.');
  };

  const confirmToggleStatus = async () => {
    if (!confirmToggle) return;
    setToggleLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${confirmToggle.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: confirmToggle.status === 'active' ? 'disabled' : 'active' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'خطا');
      toast(confirmToggle.status === 'active' ? 'کاربر غیرفعال شد.' : 'کاربر فعال شد.');
      load(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'خطا', true);
    } finally {
      setToggleLoading(false);
      setConfirmToggle(null);
    }
  };

  const confirmRevokeInvite = async () => {
    if (!revokeInviteId) return;
    setRevokeLoading(true);
    try {
      const res = await fetch(`/api/admin/invites/${revokeInviteId}/revoke`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'خطا');
      toast('دعوت لغو شد.');
      load(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'خطا', true);
    } finally {
      setRevokeLoading(false);
      setRevokeInviteId(null);
    }
  };

  if (initialLoading) {
    return <div className="p-8 text-sm text-gray-500">در حال بارگذاری…</div>;
  }

  return (
    <>
      <AdminToast message={message} error={error} onDismiss={dismiss} />

      <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => onInnerTabChange('users')}
            className={`px-6 py-2 rounded-xl text-xs font-bold ${
              innerTab === 'users' ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-400'
            }`}
          >
            لیست کاربران
          </button>
          <button
            type="button"
            onClick={() => onInnerTabChange('roles')}
            className={`px-6 py-2 rounded-xl text-xs font-bold ${
              innerTab === 'roles' ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-400'
            }`}
          >
            تعریف نقش‌ها
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold disabled:opacity-50"
          >
            {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            بروزرسانی
          </button>
          {canWrite && innerTab === 'users' && (
            <button
              type="button"
              onClick={() => setUserFormOpen(true)}
              className="nexa-btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              افزودن کاربر
            </button>
          )}
        </div>
      </div>

      {innerTab === 'roles' ? (
        rolesSlot
      ) : (
        <div className="space-y-4">
          <div className="nexa-card p-4 flex flex-col md:flex-row gap-4 md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو نام یا username…"
                className="w-full bg-gray-50 rounded-2xl py-2.5 pr-10 pl-4 text-sm outline-none"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'disabled'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold ${
                    statusFilter === s ? 'bg-nexa-primary text-white' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {s === 'all' ? 'همه' : s === 'active' ? 'فعال' : 'غیرفعال'}
                </button>
              ))}
            </div>
          </div>

          <div className="nexa-card overflow-hidden">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-nexa-border text-xs text-gray-400">
                  <th className="px-4 py-3">کاربر</th>
                  <th className="px-4 py-3">نقش</th>
                  <th className="px-4 py-3">آخرین ورود</th>
                  <th className="px-4 py-3">وضعیت</th>
                  <th className="px-4 py-3">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexa-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-nexa-accent/10 text-nexa-accent flex items-center justify-center font-black text-xs">
                          {user.displayName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{user.displayName}</p>
                          <p className="text-[10px] text-gray-400 dir-ltr">{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg">{user.systemRole.nameFa}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatLastLogin(user.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      {user.status === 'active' ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg inline-flex items-center gap-1">
                          <UserCheck size={12} /> فعال
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg inline-flex items-center gap-1">
                          <UserX size={12} /> غیرفعال
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 relative">
                      {canWrite && user.id !== me?.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreVertical size={18} />
                          </button>
                          <AnimatePresence>
                            {actionMenuId === user.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="absolute left-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-nexa-border z-20 p-2 space-y-1"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditUser(user);
                                      setActionMenuId(null);
                                    }}
                                    className="w-full text-right text-xs font-bold px-2 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <UserCog size={14} /> ویرایش
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResetUser(user);
                                      setActionMenuId(null);
                                    }}
                                    className="w-full text-right text-xs font-bold px-2 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-nexa-accent"
                                  >
                                    <KeyRound size={14} /> ریست رمز
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmToggle(user);
                                      setActionMenuId(null);
                                    }}
                                    className="w-full text-right text-xs font-bold px-2 py-2 rounded-xl hover:bg-gray-50"
                                  >
                                    {user.status === 'active' ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canInvite && invites.length > 0 && (
            <div className="nexa-card p-4">
              <h3 className="text-sm font-black mb-3">دعوت‌های اخیر</h3>
              <div className="space-y-2 text-xs">
                {invites.slice(0, 8).map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center border-b border-nexa-border/50 py-2 gap-2">
                    <span>
                      {inv.displayName ?? '—'} · {inv.role.nameFa} · {inv.credentialMode ?? 'self'}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-gray-400">{inv.status}</span>
                      {inv.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => setRevokeInviteId(inv.id)}
                          className="text-rose-600 font-bold"
                        >
                          لغو
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <UserFormModal
        open={userFormOpen}
        onClose={() => setUserFormOpen(false)}
        roles={assignableRoles}
        canInvite={canInvite}
        onSubmit={handleProvision}
      />
      <EditUserModal
        open={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        user={
          editUser
            ? {
                id: editUser.id,
                displayName: editUser.displayName,
                systemRoleId: editUser.systemRole.id,
                mustChangePassword: editUser.mustChangePassword,
              }
            : null
        }
        roles={assignableRoles.map((r) => ({ id: r.id, nameFa: r.nameFa }))}
        onSubmit={handleEdit}
      />
      <ResetPasswordModal
        open={Boolean(resetUser)}
        onClose={() => setResetUser(null)}
        username={resetUser?.username ?? ''}
        onSubmit={handleResetPassword}
      />
      <ConfirmDialog
        open={Boolean(confirmToggle)}
        onClose={() => setConfirmToggle(null)}
        onConfirm={confirmToggleStatus}
        loading={toggleLoading}
        variant="danger"
        title="تغییر وضعیت کاربر"
        message={`آیا از ${confirmToggle?.status === 'active' ? 'غیرفعال' : 'فعال'} کردن «${confirmToggle?.displayName}» مطمئن هستید؟`}
        confirmLabel="بله، انجام شود"
      />
      <ConfirmDialog
        open={Boolean(revokeInviteId)}
        onClose={() => setRevokeInviteId(null)}
        onConfirm={confirmRevokeInvite}
        loading={revokeLoading}
        variant="danger"
        title="لغو دعوت"
        message="این لینک دعوت دیگر قابل استفاده نخواهد بود."
        confirmLabel="لغو دعوت"
      />
      <CredentialsRevealModal
        open={Boolean(credentials)}
        onClose={() => setCredentials(null)}
        credentials={credentials}
        onCopy={() => {
          if (!credentials) return;
          navigator.clipboard.writeText(`username: ${credentials.username}\npassword: ${credentials.password}`);
          toast('اطلاعات ورود کپی شد.');
        }}
      />
      <InviteLinkModal
        open={Boolean(inviteUrl)}
        onClose={() => setInviteUrl(null)}
        url={inviteUrl}
        onCopy={() => {
          if (!inviteUrl) return;
          navigator.clipboard.writeText(inviteUrl);
          toast('لینک کپی شد.');
        }}
      />
    </>
  );
}
