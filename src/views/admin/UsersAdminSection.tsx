'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Copy,
  KeyRound,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
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
  displayName?: string | null;
  credentialMode?: string;
};

type CredentialMode = 'manual' | 'auto' | 'self';
type DeliveryMode = 'direct' | 'invite';

type ProvisionResult = {
  delivery: DeliveryMode;
  credentials?: { username: string; password: string } | null;
  invite?: { url: string };
};

export default function UsersAdminSection() {
  const { user: me } = useAuth();
  const canWrite = Boolean(me?.systemRole.permissions['users:write'] || me?.systemRole.slug === 'super_admin');
  const canInvite = Boolean(me?.systemRole.permissions['invites:write'] || me?.systemRole.slug === 'super_admin');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    username: '',
    password: '',
    systemRoleId: '',
    credentialMode: 'manual' as CredentialMode,
    delivery: 'direct' as DeliveryMode,
  });
  const [lastResult, setLastResult] = useState<ProvisionResult | null>(null);

  const assignableRoles = roles.filter((r) => {
    if (!me) return false;
    if (me.systemRole.slug === 'super_admin') return true;
    return r.level < me.systemRole.level && r.slug !== 'super_admin';
  });

  const defaultRoleId =
    assignableRoles.find((r) => r.slug === 'sales')?.id ?? assignableRoles[0]?.id ?? '';

  const showToast = useCallback((text: string, isError = false) => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    if (isError) {
      setError(text);
      setMessage(null);
    } else {
      setMessage(text);
      setError(null);
    }
    messageTimer.current = setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 5000);
  }, []);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!silent) setInitialLoading(true);
      else setRefreshing(true);

      try {
        const [usersRes, invitesRes] = await Promise.all([
          fetch('/api/admin/users', { credentials: 'include' }),
          canInvite ? fetch('/api/admin/invites', { credentials: 'include' }) : Promise.resolve(null),
        ]);

        const usersJson = await usersRes.json();
        if (!usersRes.ok) throw new Error(usersJson.error?.message ?? 'خطا در بارگذاری کاربران');

        setUsers(usersJson.data.users);
        setRoles(usersJson.data.roles);

        if (invitesRes) {
          const invitesJson = await invitesRes.json();
          if (invitesRes.ok) setInvites(invitesJson.data.invites);
        }
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'خطا', true);
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [canInvite, showToast]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (defaultRoleId && !form.systemRoleId) {
      setForm((p) => ({ ...p, systemRoleId: defaultRoleId }));
    }
  }, [defaultRoleId, form.systemRoleId]);

  useEffect(() => {
    if (form.delivery === 'direct' && form.credentialMode === 'self') {
      setForm((p) => ({ ...p, credentialMode: 'manual' }));
    }
  }, [form.delivery, form.credentialMode]);

  const resetForm = () => {
    setForm({
      displayName: '',
      username: '',
      password: '',
      systemRoleId: defaultRoleId,
      credentialMode: 'manual',
      delivery: 'direct',
    });
    setLastResult(null);
  };

  const provision = async () => {
    if (!form.displayName.trim() || !form.systemRoleId) {
      showToast('نام نمایشی و نقش الزامی است.', true);
      return;
    }
    if (form.credentialMode === 'manual' && (!form.username.trim() || !form.password)) {
      showToast('نام کاربری و رمز عبور را وارد کنید.', true);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users/provision', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          systemRoleId: form.systemRoleId,
          credentialMode: form.credentialMode,
          delivery: form.delivery,
          username: form.credentialMode === 'manual' ? form.username.trim() : undefined,
          password: form.credentialMode === 'manual' ? form.password : undefined,
          expiresInDays: 7,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error?.message ?? 'خطا', true);
        return;
      }

      const data = json.data as ProvisionResult & { user?: UserRow };
      setLastResult(data);

      if (data.delivery === 'direct') {
        showToast('کاربر با موفقیت ساخته شد.');
        if (data.user) setUsers((prev) => [data.user as UserRow, ...prev]);
      } else {
        showToast('لینک دعوت ساخته شد.');
        load({ silent: true });
      }

      setShowCreate(false);
      resetForm();
    } catch {
      showToast('خطا در ارتباط با سرور.', true);
    } finally {
      setSaving(false);
    }
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
      showToast(json.error?.message ?? 'خطا', true);
      return;
    }
    showToast('رمز عبور بروزرسانی شد.');
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
      showToast(json.error?.message ?? 'خطا', true);
      return;
    }
    setUsers((prev) =>
      prev.map((row) =>
        row.id === u.id ? { ...row, status: u.status === 'active' ? 'disabled' : 'active' } : row
      )
    );
    showToast(u.status === 'active' ? 'کاربر غیرفعال شد.' : 'کاربر فعال شد.');
  };

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    showToast(`${label} کپی شد.`);
  };

  if (initialLoading) {
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
          <p className="text-sm text-gray-500 mt-1">ساخت کاربر، تعیین نقش، لینک دعوت — دستی یا خودکار</p>
        </div>
        <button
          type="button"
          onClick={() => load({ silent: true })}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold hover:bg-gray-50 disabled:opacity-60"
        >
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          بروزرسانی
        </button>
      </div>

      {message && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-2xl px-4 py-3 animate-in fade-in">
          {message}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 animate-in fade-in">
          {error}
        </div>
      )}

      {lastResult?.credentials && (
        <div className="text-sm bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 space-y-2">
          <p className="font-bold text-amber-900">اطلاعات ورود (فقط یک‌بار نمایش داده می‌شود)</p>
          <p className="dir-ltr text-xs">
            username: <strong>{lastResult.credentials.username}</strong>
          </p>
          <p className="dir-ltr text-xs">
            password: <strong>{lastResult.credentials.password}</strong>
          </p>
          <button
            type="button"
            onClick={() =>
              copyText(
                `username: ${lastResult.credentials!.username}\npassword: ${lastResult.credentials!.password}`,
                'اطلاعات ورود'
              )
            }
            className="text-xs font-bold text-amber-800 flex items-center gap-1"
          >
            <Copy size={14} />
            کپی اطلاعات
          </button>
        </div>
      )}

      {lastResult?.invite?.url && (
        <div className="text-sm bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 space-y-2">
          <p className="font-bold text-blue-900 flex items-center gap-2">
            <Link2 size={16} />
            لینک دعوت
          </p>
          <p className="text-xs text-gray-600 break-all dir-ltr">{lastResult.invite.url}</p>
          <button
            type="button"
            onClick={() => copyText(lastResult.invite!.url, 'لینک')}
            className="text-xs font-bold text-blue-800 flex items-center gap-1"
          >
            <Copy size={14} />
            کپی لینک
          </button>
        </div>
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
              کاربر / دعوت جدید
            </button>
          ) : (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  placeholder="نام و نام‌خانوادگی"
                  value={form.displayName}
                  onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                  className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm md:col-span-2"
                />

                <select
                  value={form.systemRoleId || defaultRoleId}
                  onChange={(e) => setForm((p) => ({ ...p, systemRoleId: e.target.value }))}
                  className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm md:col-span-2"
                >
                  {assignableRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nameFa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-600 mb-2">نحوه ساخت حساب</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['manual', 'ورود دستی username/password'],
                      ['auto', 'ساخت خودکار توسط سیستم'],
                      ...(form.delivery === 'invite'
                        ? ([['self', 'کاربر خودش انتخاب کند']] as const)
                        : []),
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, credentialMode: mode }))}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        form.credentialMode === mode
                          ? 'bg-nexa-accent text-white border-nexa-accent'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {mode === 'auto' && <Sparkles size={12} className="inline ml-1" />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {form.credentialMode === 'manual' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    placeholder="username"
                    dir="ltr"
                    value={form.username}
                    onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                    className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
                  />
                  <input
                    type="password"
                    placeholder="رمز عبور"
                    dir="ltr"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-gray-600 mb-2">تحویل</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['direct', 'ساخت فوری (بدون لینk)'],
                      ['invite', 'ارسال لینk دعوت'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, delivery: mode }))}
                      disabled={!canInvite && mode === 'invite'}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-40 ${
                        form.delivery === mode
                          ? 'bg-nexa-primary text-white border-nexa-primary'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={provision}
                  disabled={saving}
                  className="flex items-center gap-2 bg-nexa-accent text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {saving ? 'در حال ذخیره…' : form.delivery === 'invite' ? 'ساخت لینk' : 'ذخیره کاربر'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border"
                >
                  انصراف
                </button>
              </div>
            </div>
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
              <div key={inv.id} className="flex justify-between border-b py-2 gap-4">
                <span>
                  {inv.displayName ?? '—'} · {inv.role.nameFa}
                </span>
                <span className="text-gray-400 shrink-0">
                  {inv.credentialMode ?? 'self'} · {inv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
