'use client';

import React, { useState } from 'react';
import { Loader2, Plus, Sparkles, UserPlus } from 'lucide-react';
import AdminModal from '@/src/components/admin/AdminModal';

type RoleOption = { id: string; nameFa: string; slug: string };

type CredentialMode = 'manual' | 'auto' | 'self';
type DeliveryMode = 'direct' | 'invite';

export type UserFormResult = {
  delivery: DeliveryMode;
  credentials?: { username: string; password: string };
  inviteUrl?: string;
};

type UserFormModalProps = {
  open: boolean;
  onClose: () => void;
  roles: RoleOption[];
  canInvite: boolean;
  onSubmit: (data: {
    displayName: string;
    systemRoleId: string;
    credentialMode: CredentialMode;
    delivery: DeliveryMode;
    username?: string;
    password?: string;
  }) => Promise<void>;
};

export default function UserFormModal({ open, onClose, roles, canInvite, onSubmit }: UserFormModalProps) {
  const defaultRole = roles.find((r) => r.slug === 'sales')?.id ?? roles[0]?.id ?? '';
  const [displayName, setDisplayName] = useState('');
  const [systemRoleId, setSystemRoleId] = useState(defaultRole);
  const [credentialMode, setCredentialMode] = useState<CredentialMode>('manual');
  const [delivery, setDelivery] = useState<DeliveryMode>('direct');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDisplayName('');
    setSystemRoleId(defaultRole);
    setCredentialMode('manual');
    setDelivery('direct');
    setUsername('');
    setPassword('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError('نام نمایشی الزامی است.');
      return;
    }
    if (credentialMode === 'manual' && (!username.trim() || !password)) {
      setError('نام کاربری و رمز عبور الزامی است.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        displayName: displayName.trim(),
        systemRoleId,
        credentialMode,
        delivery,
        username: credentialMode === 'manual' ? username.trim() : undefined,
        password: credentialMode === 'manual' ? password : undefined,
      });
      reset();
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
      onClose={handleClose}
      title={
        <span className="flex items-center gap-2">
          <UserPlus size={20} className="text-nexa-accent" />
          افزودن کاربر
        </span>
      }
      maxWidth="lg"
      footer={
        <>
          <button type="button" onClick={handleClose} className="px-4 py-2 rounded-xl text-xs font-bold border">
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-nexa-accent text-white disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {delivery === 'invite' ? 'ساخت لینک' : 'ذخیره کاربر'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <input
          placeholder="نام و نام‌خانوادگی"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
        />
        <select
          value={systemRoleId || defaultRole}
          onChange={(e) => setSystemRoleId(e.target.value)}
          className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nameFa}
            </option>
          ))}
        </select>

        <div>
          <p className="text-xs font-bold text-gray-600 mb-2">نحوه ساخت حساب</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['manual', 'ورود دستی'],
                ['auto', 'ساخت خودکار'],
                ...(delivery === 'invite' ? ([['self', 'کاربر خودش انتخاب کند']] as const) : []),
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCredentialMode(mode)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                  credentialMode === mode ? 'bg-nexa-accent text-white border-nexa-accent' : 'bg-white'
                }`}
              >
                {mode === 'auto' && <Sparkles size={12} className="inline ml-1" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {credentialMode === 'manual' && (
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="username"
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
            />
            <input
              type="password"
              placeholder="رمز عبور"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-gray-600 mb-2">تحویل</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['direct', 'ساخت فوری (بدون لینک)'],
                ['invite', 'ارسال لینک دعوت'],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                disabled={!canInvite && mode === 'invite'}
                onClick={() => {
                  setDelivery(mode);
                  if (mode === 'direct' && credentialMode === 'self') setCredentialMode('manual');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border disabled:opacity-40 ${
                  delivery === mode ? 'bg-nexa-primary text-white border-nexa-primary' : 'bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
      </div>
    </AdminModal>
  );
}
