'use client';

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

type AdminToastProps = {
  message: string | null;
  error?: string | null;
  onDismiss?: () => void;
};

export default function AdminToast({ message, error, onDismiss }: AdminToastProps) {
  const text = error ?? message;
  if (!text) return null;
  const isError = Boolean(error);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`flex items-center gap-2 text-sm rounded-2xl px-4 py-3 border ${
          isError
            ? 'text-red-700 bg-red-50 border-red-100'
            : 'text-green-700 bg-green-50 border-green-100'
        }`}
      >
        {isError ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
        <span className="flex-1">{text}</span>
        {onDismiss && (
          <button type="button" onClick={onDismiss} className="text-xs font-bold opacity-60 hover:opacity-100">
            بستن
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function useAdminToast(timeoutMs = 5000) {
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = React.useCallback(() => {
    setMessage(null);
    setError(null);
  }, []);

  const toast = React.useCallback(
    (text: string, isError = false) => {
      if (timer.current) clearTimeout(timer.current);
      if (isError) {
        setError(text);
        setMessage(null);
      } else {
        setMessage(text);
        setError(null);
      }
      timer.current = setTimeout(dismiss, timeoutMs);
    },
    [dismiss, timeoutMs]
  );

  return { message, error, toast, dismiss };
}
