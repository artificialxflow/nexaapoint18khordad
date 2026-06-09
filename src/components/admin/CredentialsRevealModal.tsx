'use client';

import React from 'react';
import { Copy, ShieldAlert } from 'lucide-react';
import AdminModal from '@/src/components/admin/AdminModal';

type CredentialsRevealModalProps = {
  open: boolean;
  onClose: () => void;
  credentials: { username: string; password: string } | null;
  onCopy?: () => void;
};

export default function CredentialsRevealModal({
  open,
  onClose,
  credentials,
  onCopy,
}: CredentialsRevealModalProps) {
  if (!credentials) return null;

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <ShieldAlert size={20} className="text-amber-500" />
          اطلاعات ورود (یک‌بار)
        </span>
      }
      maxWidth="sm"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-nexa-accent text-white"
        >
          متوجه شدم
        </button>
      }
    >
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
        این اطلاعات فقط یک‌بار نمایش داده می‌شود. آن را در جای امن ذخیره کنید.
      </p>
      <div className="space-y-2 text-sm dir-ltr bg-gray-50 rounded-xl p-4">
        <p>
          username: <strong>{credentials.username}</strong>
        </p>
        <p>
          password: <strong>{credentials.password}</strong>
        </p>
      </div>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="mt-4 flex items-center gap-2 text-xs font-bold text-nexa-accent"
        >
          <Copy size={14} />
          کپی اطلاعات
        </button>
      )}
    </AdminModal>
  );
}
