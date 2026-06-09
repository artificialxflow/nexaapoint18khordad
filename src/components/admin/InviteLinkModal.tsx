'use client';

import React from 'react';
import { Copy, Link2 } from 'lucide-react';
import AdminModal from '@/src/components/admin/AdminModal';

type InviteLinkModalProps = {
  open: boolean;
  onClose: () => void;
  url: string | null;
  onCopy?: () => void;
};

export default function InviteLinkModal({ open, onClose, url, onCopy }: InviteLinkModalProps) {
  if (!url) return null;

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Link2 size={20} className="text-nexa-accent" />
          لینک دعوت
        </span>
      }
      maxWidth="md"
      footer={
        <>
          {onCopy && (
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border"
            >
              <Copy size={14} />
              کپی لینک
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-nexa-accent text-white"
          >
            بستن
          </button>
        </>
      }
    >
      <p className="text-xs text-gray-500 break-all dir-ltr bg-gray-50 rounded-xl p-4">{url}</p>
    </AdminModal>
  );
}
