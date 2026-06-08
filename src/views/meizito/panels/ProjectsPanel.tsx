'use client';

import React, { useMemo, useState } from 'react';
import { FolderKanban, Plus, Search, X } from 'lucide-react';
import { useCatalog } from '@/src/context/CatalogContext';
import { useMeizito } from '@/src/context/MeizitoContext';
import { NcFolderLinkButton } from '@/src/components/nextcloud/NcFolderLinkButton';
import { ncPathForProject } from '@/src/lib/nextcloud/paths';
import type { MeizitoProject } from '@/src/types/meizito';
import type { Person, PersonRole } from '@/src/types/person';

const ROLE_LABELS: Record<PersonRole, string> = {
  customer: 'مشتری',
  supplier: 'تامین‌کننده',
  shareholder: 'سهامدار',
  subordinate: 'زیرمجموعه',
};

function personRoleText(p: Person): string {
  return p.roles.map((r) => ROLE_LABELS[r] ?? r).join('، ') || '—';
}

function resolveMemberNames(project: MeizitoProject, people: Person[]): string[] {
  if (project.memberIds.length > 0) {
    return project.memberIds.map(
      (id) => people.find((p) => p.id === id)?.displayName ?? `شناسه ${id}`
    );
  }
  return project.members ?? [];
}

function MemberChips({ names, max = 3 }: { names: string[]; max?: number }) {
  if (names.length === 0) return <span className="text-xs text-gray-400">بدون عضو</span>;
  const visible = names.slice(0, max);
  const rest = names.length - max;
  return (
    <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
      {visible.map((name) => (
        <span
          key={name}
          className="text-[10px] font-bold bg-white/80 border border-black/10 rounded-full px-2 py-0.5"
        >
          {name}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
          +{rest}
        </span>
      )}
    </div>
  );
}

export default function ProjectsPanel() {
  const { people } = useCatalog();
  const { projects, addProject, boards, cards } = useMeizito();

  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [boardId, setBoardId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [formError, setFormError] = useState('');

  const filteredPeople = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        p.displayName.toLowerCase().includes(q) ||
        (p.alias?.toLowerCase().includes(q) ?? false) ||
        p.roles.some((r) => (ROLE_LABELS[r] ?? r).includes(q))
    );
  }, [people, memberSearch]);

  const toggleMember = (personId: string) => {
    setSelectedIds((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
    setFormError('');
  };

  const removeMember = (personId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== personId));
  };

  const submitProject = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('نام پروژه را وارد کنید.');
      return;
    }
    if (selectedIds.length === 0) {
      setFormError('حداقل یک عضو انتخاب کنید.');
      return;
    }
    addProject(trimmed, selectedIds, boardId || undefined);
    setName('');
    setSelectedIds([]);
    setBoardId('');
    setMemberSearch('');
    setFormError('');
  };

  const boardCardCount = (bid?: string) => {
    if (!bid) return 0;
    return cards.filter((c) => c.boardId === bid).length;
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">پروژه‌ها — انتخاب اعضا از اشخاص</p>

      <div className="nexa-card p-5 space-y-4">
        <p className="text-sm font-black flex items-center gap-2">
          <Plus size={16} />
          پروژه جدید
        </p>

        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFormError('');
          }}
          placeholder="نام پروژه"
          className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
        />

        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">میز کار متصل</label>
          <select
            value={boardId}
            onChange={(e) => setBoardId(e.target.value)}
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
          >
            <option value="">بدون اتصال</option>
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-600 mb-2">اعضای پروژه</p>
          {people.length === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
              هنوز شخصی در بخش اشخاص ثبت نشده. ابتدا از منوی «اشخاص» حداقل یک شخص اضافه کنید.
            </p>
          ) : (
            <>
              {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3" dir="rtl">
                  {selectedIds.map((id) => {
                    const person = people.find((p) => p.id === id);
                    if (!person) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-nexa-accent/10 text-nexa-accent border border-nexa-accent/20 rounded-full pl-1 pr-2 py-0.5"
                      >
                        {person.displayName}
                        <button
                          type="button"
                          onClick={() => removeMember(id)}
                          className="p-0.5 rounded-full hover:bg-nexa-accent/20"
                          aria-label={`حذف ${person.displayName}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="relative mb-2">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="جستجو نام یا نقش..."
                  className="w-full bg-gray-50 rounded-xl pr-9 pl-3 py-2 text-sm"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-nexa-border rounded-xl divide-y divide-gray-100">
                {filteredPeople.length === 0 ? (
                  <p className="text-xs text-gray-400 p-3 text-center">نتیجه‌ای یافت نشد.</p>
                ) : (
                  filteredPeople.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleMember(p.id)}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-bold text-gray-900 truncate">{p.displayName}</p>
                        <p className="text-[10px] text-gray-500">{personRoleText(p)}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {formError && <p className="text-xs text-rose-600 font-bold">{formError}</p>}

        <button
          type="button"
          onClick={submitProject}
          disabled={people.length === 0}
          className="nexa-btn-primary w-full flex items-center justify-center gap-2 py-2 text-sm font-bold disabled:opacity-50"
        >
          <Plus size={16} />
          ثبت پروژه
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {projects.length === 0 && (
          <p className="text-sm text-gray-400 col-span-2 text-center py-6">پروژه‌ای ثبت نشده است.</p>
        )}
        {projects.map((p) => {
          const memberNames = resolveMemberNames(p, people);
          const board = boards.find((b) => b.id === p.boardId);
          const cardCount = boardCardCount(p.boardId);

          return (
            <div key={p.id} className="nexa-card p-4 flex flex-col gap-3">
              <div className="flex gap-3 items-start">
                <FolderKanban className="text-nexa-accent shrink-0" size={22} />
                <div className="flex-1 min-w-0 text-right">
                  <p className="font-bold text-gray-900">{p.name}</p>
                  {board && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      میز کار: <span className="font-bold">{board.name}</span>
                      {cardCount > 0 && (
                        <span className="mr-1"> — {cardCount} کارت</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <MemberChips names={memberNames} />
              <NcFolderLinkButton
                folderPath={p.ncFolderPath ?? ncPathForProject(p.id)}
                label="پوشه فایل پروژه"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
