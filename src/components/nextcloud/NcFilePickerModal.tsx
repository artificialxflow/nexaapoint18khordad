'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Folder, FileText, Upload, X, Loader2 } from 'lucide-react';
import { useNextcloudList } from '@/src/hooks/useNextcloudList';
import { NEXA_ROOT } from '@/src/lib/nextcloud/paths';
import { uploadFileToNextcloud } from '@/src/lib/nextcloud/uploadClient';
import type { NcFileRef } from '@/src/types/nextcloud';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (ref: NcFileRef) => void;
  initialPath?: string;
};

export function NcFilePickerModal({ open, onClose, onSelect, initialPath = `${NEXA_ROOT}/` }: Props) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [selected, setSelected] = useState<NcFileRef | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { items, loading, error, configured, reload } = useNextcloudList(currentPath, open);

  useEffect(() => {
    if (open) {
      setCurrentPath(initialPath);
      setSelected(null);
    }
  }, [open, initialPath]);

  if (!open) return null;

  const parentPath = () => {
    const p = currentPath.replace(/\/$/, '');
    const idx = p.lastIndexOf('/');
    if (idx <= 0) return `${NEXA_ROOT}/`;
    const parent = p.slice(0, idx);
    return parent.startsWith(NEXA_ROOT) ? `${parent}/` : `${NEXA_ROOT}/`;
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  const pickFile = (item: { path: string; name: string; mimeType?: string; size?: number }) => {
    setSelected({
      path: item.path,
      name: item.name,
      mimeType: item.mimeType || 'application/octet-stream',
      size: item.size,
    });
  };

  const confirmSelect = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    const ref = await uploadFileToNextcloud(file, currentPath);
    setUploading(false);
    if (ref) {
      onSelect(ref);
      onClose();
    } else {
      window.alert('آپلود ناموفق — Nextcloud را بررسی کنید یا فایل کوچک‌تری انتخاب کنید.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <p className="text-sm font-black text-gray-900">انتخاب از Nextcloud</p>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-2 flex flex-wrap items-center gap-1 text-[10px] text-gray-500">
          <button type="button" onClick={() => setCurrentPath(`${NEXA_ROOT}/`)} className="font-bold text-nexa-accent">
            Nexa
          </button>
          {breadcrumbs.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={10} />
              <button
                type="button"
                className="hover:text-nexa-accent"
                onClick={() => {
                  const idx = breadcrumbs.indexOf(seg);
                  setCurrentPath(`/${breadcrumbs.slice(0, idx + 1).join('/')}/`);
                }}
              >
                {seg}
              </button>
            </span>
          ))}
        </div>

        {configured === false && (
          <p className="mx-4 mb-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
            {error || 'Nextcloud پیکربندی نشده — فقط آپلود محلی/mock در ماژول‌ها فعال است.'}
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-4 min-h-[200px]">
          {loading ? (
            <p className="text-sm text-gray-400 flex items-center gap-2 py-8 justify-center">
              <Loader2 size={16} className="animate-spin" />
              در حال بارگذاری…
            </p>
          ) : error && configured !== false ? (
            <p className="text-sm text-rose-600 py-4">{error}</p>
          ) : (
            <ul className="space-y-1">
              {currentPath !== `${NEXA_ROOT}/` && (
                <li>
                  <button
                    type="button"
                    onClick={() => setCurrentPath(parentPath())}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-50 text-sm text-right"
                  >
                    <Folder size={16} className="text-gray-400" />
                    ..
                  </button>
                </li>
              )}
              {items.map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.type === 'dir') setCurrentPath(item.path.endsWith('/') ? item.path : `${item.path}/`);
                      else pickFile(item);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-sm text-right ${
                      selected?.path === item.path ? 'bg-nexa-accent/10 ring-1 ring-nexa-accent' : 'hover:bg-gray-50'
                    }`}
                  >
                    {item.type === 'dir' ? (
                      <Folder size={16} className="text-amber-500 shrink-0" />
                    ) : (
                      <FileText size={16} className="text-nexa-accent shrink-0" />
                    )}
                    <span className="truncate flex-1">{item.name}</span>
                  </button>
                </li>
              ))}
              {items.length === 0 && !loading && (
                <p className="text-xs text-gray-400 text-center py-6">پوشه خالی است</p>
              )}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={uploading || configured === false}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-gray-100 disabled:opacity-50"
          >
            <Upload size={14} />
            {uploading ? 'در حال آپلود…' : 'آپلود فایل'}
          </button>
          <button type="button" onClick={() => reload()} className="text-xs font-bold px-3 py-2 rounded-xl bg-gray-100">
            بروزرسانی
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={confirmSelect}
            className="mr-auto nexa-btn-primary px-4 py-2 text-xs font-bold disabled:opacity-50"
          >
            انتخاب
          </button>
        </div>
      </div>
    </div>
  );
}
