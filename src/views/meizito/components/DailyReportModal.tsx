'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMeizito } from '@/src/context/MeizitoContext';
import type { MeizitoDailyReport } from '@/src/types/meizito';

type Props = {
  open: boolean;
  onClose: () => void;
  dateKey: string;
  existing?: MeizitoDailyReport;
};

export default function DailyReportModal({ open, onClose, dateKey, existing }: Props) {
  const {
    currentUserId,
    currentUserName,
    addDailyReport,
    updateDailyReport,
    submitDailyReport,
  } = useMeizito();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(existing?.title ?? '');
      setBody(existing?.body ?? '');
    }
  }, [open, existing]);

  const saveDraft = () => {
    if (!title.trim() && !body.trim()) return;
    if (existing) {
      updateDailyReport(existing.id, { title: title.trim() || 'گزارش روز', body, status: 'draft' });
    } else {
      addDailyReport({
        authorId: currentUserId,
        authorName: currentUserName,
        date: dateKey,
        title: title.trim() || 'گزارش روز',
        body,
        status: 'draft',
      });
    }
    onClose();
  };

  const submit = () => {
    if (!title.trim() && !body.trim()) return;
    if (existing) {
      updateDailyReport(existing.id, {
        title: title.trim() || 'گزارش روز',
        body,
        status: 'submitted',
      });
    } else {
      const id = addDailyReport({
        authorId: currentUserId,
        authorName: currentUserName,
        date: dateKey,
        title: title.trim() || 'گزارش روز',
        body,
        status: 'submitted',
      });
      submitDailyReport(id);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative bg-white rounded-2xl p-6 w-full max-w-lg border border-nexa-border shadow-xl"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-gray-900">گزارش روزانه</h3>
              <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3 font-fa-num">تاریخ: {dateKey}</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان گزارش"
              className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm mb-3"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="خلاصه عملکرد امروز..."
              className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveDraft}
                className="flex-1 bg-gray-100 rounded-xl py-2.5 text-sm font-bold"
              >
                ذخیره پیش‌نویس
              </button>
              <button type="button" onClick={submit} className="flex-1 nexa-btn-primary py-2.5 text-sm font-bold">
                ارسال نهایی
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
