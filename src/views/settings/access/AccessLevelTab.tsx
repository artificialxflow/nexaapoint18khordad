'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdminToast, { useAdminToast } from '@/src/components/admin/AdminToast';
import { ACCESS_LEVEL_PRESETS } from '@/src/lib/auth/permissions-catalog';
import type { AdminUserRow } from '@/src/views/settings/access/types';

export default function AccessLevelTab() {
  const { message, error, toast, dismiss } = useAdminToast();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [preset, setPreset] = useState('custom');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users', { credentials: 'include' })
      .then(async (res) => {
        const json = await res.json();
        if (res.ok) {
          setUsers(json.data.users);
          if (json.data.users[0]) {
            setSelectedUserId(json.data.users[0].id);
            setPreset(json.data.users[0].accessLevelPreset ?? 'custom');
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const onUserChange = (id: string) => {
    setSelectedUserId(id);
    const u = users.find((x) => x.id === id);
    setPreset(u?.accessLevelPreset ?? 'custom');
  };

  const save = useCallback(async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessLevelPreset: preset }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'خطا');
      toast('سطح دسترسی ذخیره شد.');
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUserId ? { ...u, accessLevelPreset: preset } : u))
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : 'خطا', true);
    } finally {
      setSaving(false);
    }
  }, [preset, selectedUserId, toast]);

  if (loading) return <div className="text-sm text-gray-500">در حال بارگذاری…</div>;

  return (
    <div className="nexa-card p-6 space-y-4">
      <AdminToast message={message} error={error} onDismiss={dismiss} />
      <h3 className="text-sm font-black text-gray-900">تنظیم سطح دسترسی (۰۹)</h3>
      <select
        value={selectedUserId}
        onChange={(e) => onUserChange(e.target.value)}
        className="w-full max-w-md bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.displayName} ({u.username})
          </option>
        ))}
      </select>
      <div className="grid md:grid-cols-2 gap-3">
        {ACCESS_LEVEL_PRESETS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setPreset(opt.id)}
            className={`p-4 rounded-2xl border-2 text-right transition-all ${
              preset === opt.id ? 'border-nexa-accent bg-nexa-accent/5' : 'border-transparent bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <p className="text-sm font-black text-gray-900">{opt.label}</p>
            <p className="text-[10px] text-gray-500 mt-1">{opt.desc}</p>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="nexa-btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        ذخیره سطح دسترسی
      </button>
    </div>
  );
}
