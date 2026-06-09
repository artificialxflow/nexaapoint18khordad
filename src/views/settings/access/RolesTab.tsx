'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Eye, Loader2, Shield } from 'lucide-react';
import RolePermissionsModal from '@/src/components/admin/RolePermissionsModal';
import AdminToast, { useAdminToast } from '@/src/components/admin/AdminToast';
import type { PermissionDef } from '@/src/lib/auth/permissions-catalog';
import type { AdminRoleRow } from '@/src/views/settings/access/types';
import { useAuth } from '@/src/context/AuthContext';

export default function RolesTab() {
  const { user: me } = useAuth();
  const { message, error, toast, dismiss } = useAdminToast();
  const [roles, setRoles] = useState<AdminRoleRow[]>([]);
  const [catalog, setCatalog] = useState<PermissionDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminRoleRow | null>(null);
  const canEdit = me?.systemRole.slug === 'super_admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'خطا');
      setRoles(json.data.roles);
      setCatalog(json.data.catalog);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'خطا', true);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const savePermissions = async (permissions: Record<string, boolean>) => {
    if (!selected) return;
    const res = await fetch(`/api/admin/roles/${selected.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? 'خطا');
    toast('دسترسی‌های نقش ذخیره شد.');
    load();
  };

  if (loading) return <div className="text-sm text-gray-500 p-4">در حال بارگذاری نقش‌ها…</div>;

  return (
    <>
      <AdminToast message={message} error={error} onDismiss={dismiss} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="nexa-card p-5">
            <div className="flex justify-between mb-3">
              <Shield className="text-gray-400" size={22} />
            </div>
            <h4 className="text-sm font-black text-gray-900">{role.nameFa}</h4>
            <p className="text-[10px] text-gray-400 mb-3 font-fa-num">{role.userCount ?? 0} کاربر</p>
            <button
              type="button"
              onClick={() => setSelected(role)}
              className="w-full py-2 border border-nexa-border rounded-xl text-[10px] font-bold text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <Eye size={14} />
              {canEdit && role.slug !== 'super_admin' ? 'ویرایش دسترسی‌ها' : 'مشاهده دسترسی‌ها'}
            </button>
          </div>
        ))}
      </div>
      <RolePermissionsModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        roleName={selected?.nameFa ?? ''}
        permissions={selected?.permissions ?? {}}
        catalog={catalog}
        readOnly={!canEdit || selected?.slug === 'super_admin'}
        onSubmit={savePermissions}
      />
    </>
  );
}
