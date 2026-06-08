'use client';

import React, { useState } from 'react';
import { FolderKanban, Plus, Star, Trash2 } from 'lucide-react';
import { useSettings } from '@/src/context/SettingsContext';
import { useBusiness } from '@/src/context/BusinessContext';

export default function ProjectsSection() {
  const { projects: allProjects, upsertProject, removeProject, setDefaultProject } = useSettings();
  const { activeBusiness } = useBusiness();
  const projects = allProjects.filter(
    (p) => !p.businessId || p.businessId === activeBusiness?.id
  );
  const [draft, setDraft] = useState({ name: '', isDefault: false, active: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  const submit = () => {
    if (!draft.name.trim()) return;
    upsertProject({
      id: editingId ?? undefined,
      name: draft.name.trim(),
      isDefault: draft.isDefault,
      active: draft.active,
      businessId: activeBusiness?.id,
    });
    setDraft({ name: '', isDefault: false, active: true });
    setEditingId(null);
  };

  const startEdit = (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setDraft({ name: p.name, isDefault: p.isDefault, active: p.active });
  };

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
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isDefault}
              onChange={(e) => setDraft((d) => ({ ...d, isDefault: e.target.checked }))}
            />
            پروژه پیش‌فرض (در فرم‌ها اول پیشنهاد شود)
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
            />
            پروژه فعال
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={submit} className="nexa-btn-primary px-4 py-2 text-sm flex items-center gap-2">
              <Plus size={16} />
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
              >
                انصراف
              </button>
            )}
          </div>
        </div>

        <div className="nexa-card overflow-hidden">
          <div className="p-4 border-b border-nexa-border font-bold text-sm">لیست پروژه‌ها</div>
          <div className="max-h-80 overflow-auto divide-y divide-nexa-border">
            {projects.length === 0 ? (
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
                      onClick={() => setDefaultProject(p.id)}
                      className="p-2 rounded-lg text-amber-600 hover:bg-amber-50"
                    >
                      <Star size={18} />
                    </button>
                  )}
                  {p.isDefault && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">پیش‌فرض</span>
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
                    onClick={() => removeProject(p.id)}
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
    </div>
  );
}
