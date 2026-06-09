'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdminToast, { useAdminToast } from '@/src/components/admin/AdminToast';
import type { AdminUserRow } from '@/src/views/settings/access/types';

type Restrictions = {
  ownSalesOnly: boolean;
  ownPurchaseOnly: boolean;
  timeWindowEnabled: boolean;
  allowedFrom: string | null;
  allowedTo: string | null;
};

export default function RestrictionsTab() {
  const { message, error, toast, dismiss } = useAdminToast();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [data, setData] = useState<Restrictions>({
    ownSalesOnly: false,
    ownPurchaseOnly: false,
    timeWindowEnabled: false,
    allowedFrom: null,
    allowedTo: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users', { credentials: 'include' })
      .then(async (res) => {
        const json = await res.json();
        if (res.ok && json.data.users[0]) {
          setUsers(json.data.users);
          setSelectedUserId(json.data.users[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loadRestrictions = useCallback(async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}/restrictions`, { credentials: 'include' });
    const json = await res.json();
    if (res.ok) setData(json.data.restrictions);
  }, []);

  useEffect(() => {
    if (selectedUserId) loadRestrictions(selectedUserId);
  }, [selectedUserId, loadRestrictions]);

  const save = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}/restrictions`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'خطا');
      toast('محدودیت‌ها ذخیره شد.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'خطا', true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">در حال بارگذاری…</div>;

  const rows = [
    { key: 'ownSalesOnly' as const, label: 'فقط فاکتور فروش ثبت‌شده توسط خود کاربر' },
    { key: 'ownPurchaseOnly' as const, label: 'فقط فاکتور خرید ثبت‌شده توسط خود کاربر' },
    { key: 'timeWindowEnabled' as const, label: 'محدودیت بازه زمانی ورود به سیستم' },
  ];

  return (
    <div className="nexa-card p-6 space-y-4">
      <AdminToast message={message} error={error} onDismiss={dismiss} />
      <h3 className="text-sm font-black text-gray-900">محدودیت‌های دسترسی (۱۰)</h3>
      <select
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        className="w-full max-w-md bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.displayName}
          </option>
        ))}
      </select>
      {rows.map((row) => (
        <label key={row.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer">
          <span className="text-xs font-bold text-gray-800">{row.label}</span>
          <input
            type="checkbox"
            checked={data[row.key]}
            onChange={(e) => setData((d) => ({ ...d, [row.key]: e.target.checked }))}
            className="w-4 h-4 accent-nexa-accent"
          />
        </label>
      ))}
      {data.timeWindowEnabled && (
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="از (09:00)"
            dir="ltr"
            value={data.allowedFrom ?? ''}
            onChange={(e) => setData((d) => ({ ...d, allowedFrom: e.target.value }))}
            className="bg-gray-50 rounded-xl px-4 py-2 text-sm"
          />
          <input
            placeholder="تا (18:00)"
            dir="ltr"
            value={data.allowedTo ?? ''}
            onChange={(e) => setData((d) => ({ ...d, allowedTo: e.target.value }))}
            className="bg-gray-50 rounded-xl px-4 py-2 text-sm"
          />
        </div>
      )}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="nexa-btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        ذخیره محدودیت‌ها
      </button>
    </div>
  );
}
