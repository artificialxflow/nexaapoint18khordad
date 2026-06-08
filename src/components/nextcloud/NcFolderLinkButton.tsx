'use client';

import React, { useEffect, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { fetchNextcloudStatus } from '@/src/lib/nextcloud/uploadClient';

type NcFolderLinkButtonProps = {
  folderPath: string;
  label?: string;
  className?: string;
};

export function NcFolderLinkButton({
  folderPath,
  label = 'پوشه فایل پروژه',
  className = '',
}: NcFolderLinkButtonProps) {
  const [filesBaseUrl, setFilesBaseUrl] = useState<string | undefined>();
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetchNextcloudStatus().then((s) => {
      setConfigured(s.configured);
      setFilesBaseUrl(s.filesBaseUrl);
    });
  }, []);

  const enabled = configured === true && Boolean(filesBaseUrl || process.env.NEXT_PUBLIC_NEXTCLOUD_URL);

  const openFolder = () => {
    const base = (filesBaseUrl || process.env.NEXT_PUBLIC_NEXTCLOUD_URL)?.replace(/\/$/, '');
    if (!base) return;
    const path = folderPath.startsWith('/') ? folderPath : `/${folderPath}`;
    window.open(`${base}/apps/files/?dir=${encodeURIComponent(path)}`, '_blank', 'noopener');
  };

  return (
    <button
      type="button"
      disabled={!enabled}
      title={
        enabled
          ? folderPath
          : 'Nextcloud پیکربندی نشده — env را در .env.local تنظیم کنید'
      }
      onClick={openFolder}
      className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-lg px-2 py-1 border transition-colors ${
        enabled
          ? 'border-nexa-accent text-nexa-accent hover:bg-nexa-accent/5'
          : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-70'
      } ${className}`}
    >
      <FolderOpen size={12} />
      {label}
    </button>
  );
}
