'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Copy,
  KeyRound,
  Link2,
  Plus,
  RefreshCw,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

type RoleRow = {
  id: string;
  slug: string;
  nameFa: string;
  level: number;
};

type UserRow = {
  id: string;
  username: string;
  displayName: string;
  status: 'active' | 'disabled';
  systemRole: { id: string; slug: string; nameFa: string; level: number };
  lastLoginAt?: string | null;
};

type InviteRow = {
  id: string;
  role: { slug: string; nameFa: string };
  expiresAt: string;
  usedAt?: string | null;
  status: string;
  note?: string | null;
};

export default function UsersAdminSection() {
  const { user: me } = useAuth();
  const canWrite = Boolean(me?.systemRole.permissions['users:write'] || me?.systemRole.slug === 'super_admin');
  const canInvite = Boolean(me?.systemRole.permissions['invites:write'] || me?.systemRole.slug === 'super_admin');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    displayName: '',
    systemRoleId: '',
  });

  const [inviteRoleId, setInviteRoleId] = useState('');
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, invitesRes] = await Promise.all([
        fetch('/api/admin/users', { credentials: 'include' }),
        canInvite ? fetch('/api/admin/invites', { credentials: 'include' }) : Promise.resolve(null),
      ]);

      const usersJson = await usersRes.json();
      if (!usersRes.ok) throw new Error(usersJson.error?.message ?? 'خطا در بارگذاری کاربران');

      setUsers(usersJson.data.users);
      setRoles(usersJson.data.roles);
      if (!newUser.systemRoleId && usersJson.data.roles[0]) {
        setNewUser((p) => ({ ...p, systemRoleId: usersJson.data.roles.find((r: RoleRow) => r.slug === 'sales')?.id ?? usersJson.data.roles[0].id }));
      }

      if (invitesRes) {
        const invitesJson = await invitesRes.json();
        if (invitesRes.ok) setInvites(invitesJson.data.invites);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, [canInvite, newUser.systemRoleId]);

  useEffect(() => {
    load();
  }, [load]);

  const createUser = async () => {
    setError(null);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error?.message ?? 'خطا');
      return;
    }
    setMessage('کاربر جدید ساخته شد.');
    setShowCreate(false);
    setNewUser({ username: '', password: '', displayName: '', systemRoleId: roles[0]?.id ?? '' });
    load();
  };

  const resetPassword = async (userId: string, username: string) => {
    const newPassword = window.prompt(`رمز جدید برای ${username}:`);
    if (!newPassword) return;
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error?.message ?? 'خطا');
      return;
    }
    setMessage('رمز عبور بروزرسانی شد.');
  };

  const toggleStatus = async (u: UserRow) => {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: u.status === 'active' ? 'disabled' : 'active' }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error?.message ?? 'خطا');
      return;
    }
    load();
  };

  const createInvite = async () => {
    if (!inviteRoleId) return;
    setError(null);
    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemRoleId: inviteRoleId, expiresInDays: 7 }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error?.message ?? 'خطا');
      return;
    }
    setLastInviteUrl(json.data.invite.url);
    setMessage('لینک دعوت ساخته شد.');
    load();
  };

  const copyInvite = async () => {
    if (!lastInviteUrl) return;
    await navigator.clipboard.writeText(lastInviteUrl);
    setMessage('لینک کپی شد.');
  };

  const assignableRoles = roles.filter((r) => {
    if (!me) return false;
    if (me.systemRole.slug === 'super_admin') return r.slug !== 'super_admin' || me.systemRole.slug === 'super_admin';
    return r.level < me.systemRole.level && r.slug !== 'super_admin';
  });

  if (loading) {
    return <div className="p-8 text-sm text-gray-500">در حال بارگذاری کاربران…</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Shield size={20} className="text-nexa-accent" />
            مدیریت کاربران سیستم
          </h2>
          <p className="text-sm text-gray-500 mt-1">ساخت کاربر، تغییر نقش، ریست رمز و لینک دعوت</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold hover:bg-gray-50"
        >
          <RefreshCw size={14} />
          بروزرسانی
        </button>
      </div>

      {message && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-2xl px-4 py-3">{message}</div>
      )}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>
      )}

      {canWrite && (
        <div className="bg-white rounded-2xl border border-nexa-border p-6">
          {!showCreate ? (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-nexa-accent text-white px-4 py-2.5 rounded-xl text-xs font-bold"
            >
              <Plus size={16} />
              کاربر جدید
            </button>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <input
                placeholder="نام نمایشی"
                value={newUser.displayName}
                onChange={(e) => setNewUser((p) => ({ ...p, displayName: e.target.value }))}
                className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
              />
              <input
                placeholder="username"
                dir="ltr"
                value={newUser.username}
                onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
                className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
              />
              <input
                type="password"
                placeholder="رمز عبور"
                dir="ltr"
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
              />
              <select
                value={newUser.systemRoleId}
                onChange={(e) => setNewUser((p) => ({ ...p, systemRoleId: e.target.value }))}
                className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
              >
                {assignableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nameFa}
                  </option>
                ))}
              </select>
              <div className="md:col-span-2 flex gap-2">
                <button type="button" onClick={createUser} className="bg-nexa-accent text-white px-4 py-2 rounded-xl text-xs font-bold">
                  ذخیره
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-bold border">
                  انصراف
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {canInvite && (
        <div className="bg-white rounded-2xl border border-nexa-border p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Link2 size={18} className="text-nexa-accent" />
            لینک دعوت یک‌بارمصرف
          </h3>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={inviteRoleId || assignableRoles[0]?.id || ''}
              onChange={(e) => setInviteRoleId(e.target.value)}
              className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
            >
              {assignableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameFa}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={createInvite}
              className="bg-nexa-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold"
            >
              ساخت لینک
            </button>
            {lastInviteUrl && (
              <button type="button" onClick={copyInvite} className="flex items-center gap-1 border px-3 py-2 rounded-xl text-xs font-bold">
                <Copy size={14} />
                کپی لینک
              </button>
            )}
          </div>
          {lastInviteUrl && (
            <p className="text-xs text-gray-500 break-all dir-ltr bg-gray-50 rounded-xl p-3">{lastInviteUrl}</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-nexa-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="text-right p-4 font-bold">کاربر</th>
              <th className="text-right p-4 font-bold">نقش</th>
              <th className="text-right p-4 font-bold">وضعیت</th>
              <th className="text-right p-4 font-bold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-nexa-border/60">
                <td className="p-4">
                  <div className="font-bold">{u.displayName}</div>
                  <div className="text-xs text-gray-400 dir-ltr">{u.username}</div>
                </td>
                <td className="p-4">{u.systemRole.nameFa}</td>
                <td className="p-4">
                  <span className={u.status === 'active' ? 'text-green-600' : 'text-red-500'}>
                    {u.status === 'active' ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="p-4">
                  {canWrite && u.id !== me?.id && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => resetPassword(u.id, u.username)}
                        className="text-xs font-bold text-nexa-accent flex items-center gap-1"
                      >
                        <KeyRound size={14} />
                        ریست رمز
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(u)}
                        className="text-xs font-bold text-gray-600 flex items-center gap-1"
                      >
                        {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                        {u.status === 'active' ? 'غیرفعال' : 'فعال'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canInvite && invites.length > 0 && (
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-bold mb-4">دعوت‌های اخیر</h3>
          <div className="space-y-2 text-xs">
            {invites.slice(0, 10).map((inv) => (
              <div key={inv.id} className="flex justify-between border-b py-2">
                <span>{inv.role.nameFa}</span>
                <span className="text-gray-400">{inv.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
