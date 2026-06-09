'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import AdminModal from '@/src/components/admin/AdminModal';

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأیید',
  cancelLabel = 'انصراف',
  variant = 'warning',
  loading = false,
}: ConfirmDialogProps) {
  const confirmClass =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : 'bg-nexa-primary hover:opacity-90 text-white';

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <AlertTriangle size={20} className={variant === 'danger' ? 'text-rose-500' : 'text-amber-500'} />
          {title}
        </span>
      }
      maxWidth="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? 'در حال انجام…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
    </AdminModal>
  );
}
