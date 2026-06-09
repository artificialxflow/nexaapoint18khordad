'use client';

import React, { useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import AdminModal from '@/src/components/admin/AdminModal';

type RoleOption = { id: string; nameFa: string };

type EditUserModalProps = {
  open: boolean;
  onClose: () => void;
  user: { id: string; displayName: string; systemRoleId: string; mustChangePassword?: boolean } | null;
  roles: RoleOption[];
  onSubmit: (data: { displayName: string; systemRoleId: string; mustChangePassword: boolean }) => Promise<void>;
};

export default function EditUserModal({ open, onClose, user, roles, onSubmit }: EditUserModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [systemRoleId, setSystemRoleId] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setSystemRoleId(user.systemRoleId);
      setMustChangePassword(user.mustChangePassword ?? false);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError('نام نمایشی الزامی است.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ displayName: displayName.trim(), systemRoleId, mustChangePassword });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <UserCog size={20} className="text-nexa-accent" />
          ویرایش کاربر
        </span>
      }
      footer={
        <>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold border">
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-nexa-accent text-white disabled:opacity-50"
          >
            {loading ? 'در حال ذخیره…' : 'ذخیره'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="نام نمایشی"
          className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
        />
        <select
          value={systemRoleId}
          onChange={(e) => setSystemRoleId(e.target.value)}
          className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nameFa}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mustChangePassword}
            onChange={(e) => setMustChangePassword(e.target.checked)}
            className="accent-nexa-accent"
          />
          اجبار تغییر رمز در اولین ورود
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </AdminModal>
  );
}
