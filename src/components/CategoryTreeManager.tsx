'use client';

import React, { useMemo, useState } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';

type CategoryNode = {
  id: string;
  name: string;
  parentId?: string;
};

type DropKind = 'before' | 'after' | 'child' | 'root';

type TreeRow = {
  id: string;
  name: string;
  parentId?: string;
  depth: number;
};

interface CategoryTreeManagerProps {
  title: string;
  categories: CategoryNode[];
  usedCategoryIds: Set<string>;
  draft: { id: string; name: string; parentId: string };
  setDraft: (d: { id: string; name: string; parentId: string }) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string, parentId?: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

function buildTreeRows(categories: CategoryNode[]): TreeRow[] {
  const byParent = new Map<string, CategoryNode[]>();
  categories.forEach((c) => {
    const key = c.parentId || '__root__';
    byParent.set(key, [...(byParent.get(key) || []), c]);
  });
  const rows: TreeRow[] = [];
  const walk = (parentId: string | undefined, depth: number) => {
    const key = parentId || '__root__';
    (byParent.get(key) || []).forEach((c) => {
      rows.push({ id: c.id, name: c.name, parentId: c.parentId, depth });
      walk(c.id, depth + 1);
    });
  };
  walk(undefined, 0);
  return rows;
}

export default function CategoryTreeManager({
  title,
  categories,
  usedCategoryIds,
  draft,
  setDraft,
  onSave,
  onDelete,
  onMove,
  onReorder,
}: CategoryTreeManagerProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id?: string; kind: DropKind } | null>(null);
  const rows = useMemo(() => buildTreeRows(categories), [categories]);

  const rowMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const rootCategories = categories.filter((x) => !x.parentId);

  const isDescendant = (targetId: string, maybeAncestorId: string): boolean => {
    let cur = rowMap.get(targetId);
    while (cur?.parentId) {
      if (cur.parentId === maybeAncestorId) return true;
      cur = rowMap.get(cur.parentId);
    }
    return false;
  };

  const reorder = (sourceId: string, targetId: string, kind: 'before' | 'after') => {
    const target = rowMap.get(targetId);
    if (!target) return;
    const source = rowMap.get(sourceId);
    if (!source) return;
    const levelParentId = target.parentId;
    if ((source.parentId || '') !== (levelParentId || '')) {
      onMove(sourceId, levelParentId);
    }
    const level = categories.filter((x) => (x.parentId || '') === (levelParentId || ''));
    const from = level.findIndex((x) => x.id === sourceId);
    const toBase = level.findIndex((x) => x.id === targetId);
    if (toBase < 0 || from < 0) return;
    const next = [...level];
    const [moved] = next.splice(from, 1);
    const to = kind === 'before' ? toBase : toBase + (from < toBase ? 0 : 1);
    next.splice(to, 0, moved);
    const orderedLevelIds = next.map((x) => x.id);
    const orderedIds = [
      ...orderedLevelIds,
      ...categories.filter((x) => !orderedLevelIds.includes(x.id)).map((x) => x.id),
    ];
    onReorder(orderedIds);
  };

  const handleDrop = (targetId: string | undefined, kind: DropKind) => {
    if (!draggingId) return;
    if (kind === 'root') {
      onMove(draggingId, undefined);
      setDropTarget(null);
      return;
    }
    if (!targetId || targetId === draggingId) return;
    if (kind === 'child') {
      if (isDescendant(targetId, draggingId)) return;
      onMove(draggingId, targetId);
      setDropTarget(null);
      return;
    }
    reorder(draggingId, targetId, kind);
    setDropTarget(null);
  };

  return (
    <div className="nexa-card p-4 space-y-3">
      <p className="text-sm font-black text-gray-800">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="نام دسته"
          className="col-span-2 bg-gray-50 border border-nexa-border rounded-xl px-3 py-2 text-xs"
        />
        <select
          value={draft.parentId}
          onChange={(e) => setDraft({ ...draft, parentId: e.target.value })}
          className="bg-gray-50 border border-nexa-border rounded-xl px-2 py-2 text-xs"
        >
          <option value="">دسته اصلی</option>
          {rootCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onSave}
        className="bg-gray-900 text-white rounded-xl px-4 py-2 text-xs font-bold"
      >
        ثبت دسته
      </button>

      <div
        className={`rounded-xl border border-dashed p-2 text-[11px] text-center ${
          draggingId ? 'border-nexa-accent text-nexa-accent' : 'border-gray-300 text-gray-400'
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setDropTarget({ kind: 'root' })}
        onDrop={() => handleDrop(undefined, 'root')}
      >
        رها کردن اینجا = تبدیل به دسته اصلی
      </div>

      <div className="max-h-56 overflow-auto rounded-xl border border-nexa-border bg-white p-2">
        {rows.map((row) => (
          <div key={row.id} className="space-y-1">
            <div
              className={`h-1 rounded ${dropTarget?.id === row.id && dropTarget.kind === 'before' ? 'bg-nexa-accent' : 'bg-transparent'}`}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDropTarget({ id: row.id, kind: 'before' })}
              onDrop={() => handleDrop(row.id, 'before')}
            />
            <div
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${dropTarget?.id === row.id && dropTarget.kind === 'child' ? 'border-nexa-accent bg-nexa-accent/5' : 'border-transparent hover:border-nexa-border'}`}
              style={{ marginRight: `${row.depth * 16}px` }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDropTarget({ id: row.id, kind: 'child' })}
              onDrop={() => handleDrop(row.id, 'child')}
            >
              <button
                type="button"
                draggable
                onDragStart={() => setDraggingId(row.id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDropTarget(null);
                }}
                className="text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing"
                title="جابجایی"
              >
                <GripVertical size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDraft({ id: row.id, name: row.name, parentId: row.parentId || '' })}
                className="text-xs text-blue-700 hover:underline"
              >
                {row.name}
              </button>
              <span className="mr-auto text-[10px] text-gray-400">
                {row.parentId ? 'زیرشاخه' : 'اصلی'}
              </span>
              <button
                type="button"
                className="text-rose-500 hover:text-rose-700"
                onClick={() => {
                  if (usedCategoryIds.has(row.id) && !window.confirm('این دسته در رکوردها استفاده شده است. حذف شود؟')) return;
                  onDelete(row.id);
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div
              className={`h-1 rounded ${dropTarget?.id === row.id && dropTarget.kind === 'after' ? 'bg-nexa-accent' : 'bg-transparent'}`}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDropTarget({ id: row.id, kind: 'after' })}
              onDrop={() => handleDrop(row.id, 'after')}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
