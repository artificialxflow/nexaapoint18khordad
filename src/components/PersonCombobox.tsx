'use client';

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useCatalog } from '@/src/context/CatalogContext';
import type { Person } from '@/src/types/person';

type Props = {
  value: string;
  personId?: string;
  onChange: (displayName: string, personId?: string) => void;
  placeholder?: string;
  className?: string;
};

export default function PersonCombobox({
  value,
  personId,
  onChange,
  placeholder = 'جستجوی شخص...',
  className = '',
}: Props) {
  const { people } = useCatalog();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return people.slice(0, 12);
    return people
      .filter(
        (p) =>
          p.displayName.toLowerCase().includes(term) ||
          p.alias?.toLowerCase().includes(term) ||
          p.phones?.some((ph) => ph.number.includes(term))
      )
      .slice(0, 12);
  }, [people, q]);

  const pick = (p: Person) => {
    onChange(p.displayName, p.id);
    setQ(p.displayName);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onChange(e.target.value, undefined);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full bg-gray-50 rounded-xl px-3 py-2 pr-9 text-sm"
        />
      </div>
      {personId && (
        <p className="text-[10px] text-gray-400 mt-1 font-fa-num">شناسه: {personId.slice(0, 8)}…</p>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-30 top-full mt-1 w-full bg-white border border-nexa-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full text-right px-3 py-2 text-xs hover:bg-gray-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
              >
                <span className="font-bold text-gray-800">{p.displayName}</span>
                {p.phones[0] && (
                  <span className="text-gray-400 font-fa-num mr-2"> · {p.phones[0].number}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
