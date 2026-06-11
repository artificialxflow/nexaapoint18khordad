'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FolderKanban, Loader2, Plus, Star, Trash2 } from 'lucide-react';
import { useBusiness } from '@/src/context/BusinessContext';
import ConfirmDialog from '@/src/components/admin/ConfirmDialog';

type ProjectRow = {
  id: string;
  name: string;
  isDefault: boolean;
  active: boolean;
};

export default function ProjectsSection() {
  const { activeBusiness } = useBusiness();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState({ name: '', isDefault: false, active: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProjectRow | null>(null);

  const businessId = activeBusiness?.id;

  const loadProjects = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/businesses/${businessId}/projects`, { credentials: 'include' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'بارگذاری ناموفق');
      setProjects(json.data.projects ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطای نامشخص');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const submit = async () => {
    if (!businessId || !draft.name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        const res = await fetch(`/api/businesses/${businessId}/projects/${editingId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: draft.name.trim(),
            isDefault: draft.isDefault,
            active: draft.active,
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error?.message ?? 'ذخیره ناموفق');
      } else {
        const res = await fetch(`/api/businesses/${businessId}/projects`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: draft.name.trim(),
            isDefault: draft.isDefault,
            active: draft.active,
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error?.message ?? 'ثبت ناموفق');
      }
      setDraft({ name: '', isDefault: false, active: true });
      setEditingId(null);
      await loadProjects();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطای نامشخص');
    } finally {
      setSubmitting(false);
    }
  };

  const setDefaultProject = async (projectId: string) => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/businesses/${businessId}/projects/${projectId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'خطا');
      await loadProjects();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطای نامشخص');
    }
  };

  const handleDelete = async () => {
    if (!businessId || !confirmDelete) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/projects/${confirmDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'حذف ناموفق');
      setConfirmDelete(null);
      await loadProjects();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطای نامشخص');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setDraft({ name: p.name, isDefault: p.isDefault, active: p.active });
  };

  if (!businessId) {
    return <p className="text-sm text-gray-500">ابتدا یک کسب‌وکار انتخاب کنید.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-gray-900">
        <FolderKanban className="text-nexa-accent" size={22} />
        <h2 className="text-lg font-black">پروژه‌ها</h2>
        <p className="text-xs text-gray-500 mr-auto">
          پروژه‌های حسابداری داخل کسب‌وکار:{' '}
          <span className="font-bold text-gray-700">{activeBusiness?.name ?? '—'}</span>
        </p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="nexa-card p-5 space-y-4">
          <p className="text-sm font-bold text-gray-800">{editingId ? 'ویرایش پروژه' : 'پروژه جدید'}</p>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">نام پروژه</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
              placeholder="مثال: پروژه فروشگاه مرکزی"
              disabled={submitting}
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isDefault}
              onChange={(e) => setDraft((d) => ({ ...d, isDefault: e.target.checked }))}
              disabled={submitting}
            />
            پروژه پیش‌فرض (در فرم‌ها اول پیشنهاد شود)
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
              disabled={submitting}
            />
            پروژه فعال
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!draft.name.trim() || submitting}
              className="nexa-btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {editingId ? 'ذخیره تغییرات' : 'ثبت پروژه'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setDraft({ name: '', isDefault: false, active: true });
                }}
                className="bg-gray-100 rounded-xl px-4 py-2 text-sm font-bold"
                disabled={submitting}
              >
                انصراف
              </button>
            )}
          </div>
        </div>

        <div className="nexa-card overflow-hidden">
          <div className="p-4 border-b border-nexa-border font-bold text-sm">لیست پروژه‌ها</div>
          <div className="max-h-80 overflow-auto divide-y divide-nexa-border">
            {loading ? (
              <p className="p-6 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                بارگذاری…
              </p>
            ) : projects.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">پروژه‌ای ثبت نشده.</p>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="p-4 flex items-center gap-3 hover:bg-gray-50/80">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {!p.active && 'غیرفعال — '}
                      {p.isDefault && 'پیش‌فرض'}
                    </p>
                  </div>
                  {!p.isDefault && (
                    <button
                      type="button"
                      title="پیش‌فرض"
                      onClick={() => void setDefaultProject(p.id)}
                      className="p-2 rounded-lg text-amber-600 hover:bg-amber-50"
                    >
                      <Star size={18} />
                    </button>
                  )}
                  {p.isDefault && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                      پیش‌فرض
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => startEdit(p.id)}
                    className="text-xs font-bold text-nexa-accent"
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(p)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => !submitting && setConfirmDelete(null)}
        onConfirm={() => void handleDelete()}
        title="حذف پروژه"
        message={`پروژه «${confirmDelete?.name ?? ''}» حذف شود؟`}
        confirmLabel={submitting ? 'در حال حذف…' : 'حذف'}
        variant="danger"
        loading={submitting}
      />
    </div>
  );
}
