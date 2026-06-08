'use client';

import React, { useMemo, useState } from 'react';
import { List, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useSettings } from '@/src/context/SettingsContext';
import {
  SETTINGS_PICKLIST_KINDS,
  SETTINGS_PICKLIST_KIND_LABELS,
  type SettingsPicklistKind,
} from '@/src/types/settings';

function PicklistEditor({ kind }: { kind: SettingsPicklistKind }) {
  const { getPicklist, upsertPicklistItem, removePicklistItem } = useSettings();
  const items = useMemo(() => getPicklist(kind), [getPicklist, kind]);

  const addItem = () => {
    const label = window.prompt('برچسب گزینه جدید:');
    if (!label?.trim()) return;
    upsertPicklistItem(kind, { label: label.trim(), active: true });
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[idx];
    const b = items[target];
    upsertPicklistItem(kind, { id: a.id, order: b.order });
    upsertPicklistItem(kind, { id: b.id, order: a.order });
  };

  return (
    <div className="nexa-card p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-900">{SETTINGS_PICKLIST_KIND_LABELS[kind]}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li
            key={item.id}
            className={`flex flex-wrap items-center gap-2 p-3 rounded-xl border ${
              item.active ? 'border-nexa-border bg-gray-50/50' : 'border-dashed border-gray-200 opacity-60'
            }`}
          >
            <input
              value={item.label}
              onChange={(e) => upsertPicklistItem(kind, { id: item.id, label: e.target.value })}
              className="flex-1 min-w-[140px] bg-white rounded-lg px-3 py-1.5 text-sm font-bold"
            />
            <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(e) => upsertPicklistItem(kind, { id: item.id, active: e.target.checked })}
              />
              فعال
            </label>
            <div className="flex items-center gap-1 mr-auto">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => moveItem(idx, -1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                title="بالا"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                disabled={idx === items.length - 1}
                onClick={() => moveItem(idx, 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                title="پایین"
              >
                <ChevronDown size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('حذف این گزینه؟')) removePicklistItem(kind, item.id);
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="text-xs text-gray-400">گزینه‌ای تعریف نشده.</p>
      )}
      <button
        type="button"
        onClick={addItem}
        className="text-xs font-bold text-nexa-accent flex items-center gap-1 hover:underline"
      >
        <Plus size={14} />
        افزودن گزینه
      </button>
    </div>
  );
}

export default function PicklistsSection() {
  const [openKind, setOpenKind] = useState<SettingsPicklistKind | 'all'>('all');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <List className="text-nexa-accent" size={22} />
        <h2 className="text-lg font-black text-gray-900">فهرست‌های انتخابی (تیپ)</h2>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        گزینه‌های زیر در فرم <strong>بازدید حضوری</strong>، گزارش/CSV و (در صورت نیاز) سایر فرم‌ها استفاده
        می‌شوند. پس از ذخیره، فرم بازدید در همان نشست به‌روز می‌شود.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpenKind('all')}
          className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border ${
            openKind === 'all'
              ? 'bg-nexa-accent text-white border-nexa-accent'
              : 'bg-white border-nexa-border text-gray-600'
          }`}
        >
          همه
        </button>
        {SETTINGS_PICKLIST_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setOpenKind(k)}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border ${
              openKind === k
                ? 'bg-nexa-accent text-white border-nexa-accent'
                : 'bg-white border-nexa-border text-gray-600'
            }`}
          >
            {SETTINGS_PICKLIST_KIND_LABELS[k]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {SETTINGS_PICKLIST_KINDS.filter((k) => openKind === 'all' || openKind === k).map((kind) => (
          <PicklistEditor key={kind} kind={kind} />
        ))}
      </div>
    </div>
  );
}
