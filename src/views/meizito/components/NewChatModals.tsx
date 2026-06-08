'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PersonCombobox from '@/src/components/PersonCombobox';
import type { MeizitoThreadType } from '@/src/types/meizito';

type BaseProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, participants: string[]) => void;
};

function ModalShell({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl p-6 w-full max-w-md border border-nexa-border shadow-xl space-y-4"
            dir="rtl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">{title}</h3>
              <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function NewDirectChatModal({ open, onClose, onSubmit }: BaseProps) {
  const [name, setName] = useState('');
  const [personId, setPersonId] = useState<string | undefined>();

  const submit = () => {
    if (!name.trim()) return;
    onSubmit(name.trim(), personId ? [name.trim()] : []);
    setName('');
    setPersonId(undefined);
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} title="گفتگوی جدید (شخصی)">
      <PersonCombobox
        value={name}
        personId={personId}
        onChange={(n, id) => {
          setName(n);
          setPersonId(id);
        }}
        placeholder="نام شخص یا انتخاب از اشخاص"
      />
      <button type="button" onClick={submit} className="w-full nexa-btn-primary py-2.5 text-sm font-bold">
        شروع گفتگو
      </button>
    </ModalShell>
  );
}

export function NewGroupChatModal({ open, onClose, onSubmit }: BaseProps) {
  const [title, setTitle] = useState('');
  const [members, setMembers] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    const parts = members
      .split(/[،,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    onSubmit(title.trim(), parts);
    setTitle('');
    setMembers('');
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} title="گروه جدید">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="نام گروه"
        className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
      />
      <textarea
        value={members}
        onChange={(e) => setMembers(e.target.value)}
        rows={2}
        placeholder="اعضا (با ویرگول جدا کنید)"
        className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
      />
      <button type="button" onClick={submit} className="w-full nexa-btn-primary py-2.5 text-sm font-bold">
        ساخت گروه
      </button>
    </ModalShell>
  );
}

export function NewChannelModal({ open, onClose, onSubmit }: BaseProps) {
  const [title, setTitle] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    onSubmit(title.trim(), []);
    setTitle('');
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} title="کانال جدید">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="نام کانال"
        className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
      />
      <p className="text-[10px] text-gray-500">کانال برای اطلاع‌رسانی یک‌طرفه به تیم است.</p>
      <button type="button" onClick={submit} className="w-full nexa-btn-primary py-2.5 text-sm font-bold">
        ساخت کانال
      </button>
    </ModalShell>
  );
}

export type NewChatModalKind = MeizitoThreadType | null;
