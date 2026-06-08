import React, { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { newId, useCatalog } from '@/src/context/CatalogContext';

export default function Shareholders() {
  const { shareholders, people, addShareholder, replaceShareholder, removeShareholder } =
    useCatalog();

  const total = useMemo(
    () => shareholders.reduce((acc, row) => acc + row.percent, 0),
    [shareholders]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900">سهامداران</h1>
        <p className="text-sm text-gray-500 mt-1">مدیریت ترکیب سهام و درصد مالکیت</p>
      </div>
      <div className="nexa-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-emerald-700 font-fa-num">
            مجموع: {total.toLocaleString('fa-IR')}%
          </p>
          {total > 100 && (
            <p className="text-xs font-bold text-rose-600">
              مجموع سهام بیشتر از 100% است.
            </p>
          )}
          <button
            type="button"
            onClick={() =>
              addShareholder({ id: newId(), personId: people[0]?.id || '', percent: 0 })
            }
            className="px-3 py-2 bg-gray-100 rounded-xl text-xs font-bold"
          >
            افزودن ردیف
          </button>
        </div>
        <div className="space-y-2">
          {shareholders.map((row) => (
            <div key={row.id} className="grid md:grid-cols-12 gap-2 items-center">
              <select
                value={row.personId}
                onChange={(e) => replaceShareholder({ ...row, personId: e.target.value })}
                className="md:col-span-8 bg-gray-50 rounded-xl px-3 py-2 text-sm"
              >
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.displayName}
                  </option>
                ))}
              </select>
              <input
                value={row.percent}
                onChange={(e) =>
                  replaceShareholder({
                    ...row,
                    percent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  })
                }
                className="md:col-span-3 bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num"
              />
              <button
                type="button"
                onClick={() => removeShareholder(row.id)}
                className="md:col-span-1 p-2 rounded-xl text-rose-600 hover:bg-rose-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
