'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import AdminModal from '@/src/components/admin/AdminModal';

type ResetPasswordModalProps = {
  open: boolean;
  onClose: () => void;
  username: string;
  onSubmit: (newPassword: string) => Promise<void>;
};

export default function ResetPasswordModal({ open, onClose, username, onSubmit }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const reset = () => {
    setPassword('');
    setConfirm('');
    setLocalError(null);
    setShow(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setLocalError(null);
    if (password.length < 8) {
      setLocalError('رمز عبور باید حداقل ۸ کاراکتر باشد.');
      return;
    }
    if (password !== confirm) {
      setLocalError('رمز عبور و تکرار آن یکسان نیست.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(password);
      reset();
      onClose();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'خطا');
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
          <KeyRound size={20} className="text-nexa-accent" />
          ریست رمز عبور
        </span>
      }
      maxWidth="sm"
      footer={
        <>
          <button type="button" onClick={handleClose} className="px-4 py-2 rounded-xl text-xs font-bold border">
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-nexa-accent text-white disabled:opacity-50"
          >
            {loading ? 'در حال ذخیره…' : 'ذخیره رمز جدید'}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-500 mb-4">
        کاربر: <span className="font-bold dir-ltr">{username}</span>
      </p>
      <div className="space-y-3">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            placeholder="رمز جدید"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <input
          type={show ? 'text' : 'password'}
          placeholder="تکرار رمز"
          dir="ltr"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm"
        />
      </div>
      {localError && (
        <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-xl px-3 py-2">{localError}</p>
      )}
    </AdminModal>
  );
}
