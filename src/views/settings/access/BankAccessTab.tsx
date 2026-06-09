'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdminToast, { useAdminToast } from '@/src/components/admin/AdminToast';
import type { AdminUserRow } from '@/src/views/settings/access/types';

type BankRow = { id: string; nameFa: string; code: string; allowed: boolean };

export default function BankAccessTab() {
  const { message, error, toast, dismiss } = useAdminToast();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [banks, setBanks] = useState<BankRow[]>([]);
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

  const loadBanks = useCallback(async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}/bank-access`, { credentials: 'include' });
    const json = await res.json();
    if (res.ok) setBanks(json.data.banks);
  }, []);

  useEffect(() => {
    if (selectedUserId) loadBanks(selectedUserId);
  }, [selectedUserId, loadBanks]);

  const toggle = (bankId: string) => {
    setBanks((prev) => prev.map((b) => (b.id === bankId ? { ...b, allowed: !b.allowed } : b)));
  };

  const save = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}/bank-access`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: banks.map((b) => ({ bankAccountId: b.id, allowed: b.allowed })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'خطا');
      toast('دسترسی بانک ذخیره شد.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'خطا', true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">در حال بارگذاری…</div>;

  return (
    <div className="nexa-card overflow-hidden">
      <AdminToast message={message} error={error} onDismiss={dismiss} />
      <div className="p-4 border-b border-nexa-border space-y-3">
        <div className="text-sm font-black text-gray-900">دسترسی به بانک‌ها (۱۱)</div>
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
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-500">
            <th className="px-4 py-2 text-right">بانک / صندوق</th>
            <th className="px-4 py-2 text-right">اجازه گردش</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-nexa-border">
          {banks.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-3 font-bold">{b.nameFa}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggle(b.id)}
                  className={`text-xs font-bold px-3 py-1 rounded-lg ${
                    b.allowed ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {b.allowed ? 'مجاز' : 'ممنوع'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="nexa-btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          ذخیره
        </button>
      </div>
    </div>
  );
}
