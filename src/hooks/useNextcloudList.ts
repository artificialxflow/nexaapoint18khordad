'use client';

import { useCallback, useEffect, useState } from 'react';
import type { NcListItem } from '@/src/types/nextcloud';

export function useNextcloudList(path: string, enabled: boolean) {
  const [items, setItems] = useState<NcListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const statusRes = await fetch('/api/nextcloud/status');
      const status = await statusRes.json();
      setConfigured(Boolean(status.configured));
      if (!status.configured) {
        setItems([]);
        setError(status.message || 'Nextcloud پیکربندی نشده');
        return;
      }
      const res = await fetch(`/api/nextcloud/list?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطا در دریافت لیست');
        setItems([]);
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setError('خطا در ارتباط با سرور');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [path, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, configured, reload };
}
