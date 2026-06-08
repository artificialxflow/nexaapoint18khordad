import React from 'react';
import { Trash2 } from 'lucide-react';
import { newId, useCatalog } from '@/src/context/CatalogContext';

export default function Vendors() {
  const { vendors, people, addVendor, replaceVendor, removeVendor } = useCatalog();
  const activeCount = vendors.filter((x) => x.active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900">فروشندگان</h1>
        <p className="text-sm text-gray-500 mt-1">مدیریت پورسانت فروش و بازگشت</p>
      </div>
      <div className="nexa-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500">فروشندگان فعال: {activeCount}</p>
          <button
            type="button"
            onClick={() =>
              addVendor({
                id: newId(),
                personId: people[0]?.id || '',
                sellPercent: 0,
                refundPercent: 0,
                expenseAccount: 'هزینه بازاریابی و پورسانت',
                active: true,
              })
            }
            className="px-3 py-2 bg-gray-100 rounded-xl text-xs font-bold"
          >
            افزودن فروشنده
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-nexa-border">
                <th className="px-3 py-2">شخص</th>
                <th className="px-3 py-2">درصد فروش</th>
                <th className="px-3 py-2">درصد برگشت</th>
                <th className="px-3 py-2">حساب هزینه</th>
                <th className="px-3 py-2">فعال</th>
                <th className="px-3 py-2">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexa-border">
              {vendors.map((row) => (
                <tr key={row.id} className="text-sm">
                  <td className="px-3 py-2">
                    <select
                      value={row.personId}
                      onChange={(e) => replaceVendor({ ...row, personId: e.target.value })}
                      className="w-full bg-gray-50 rounded-xl px-3 py-2"
                    >
                      {people.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.displayName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.sellPercent}
                      onChange={(e) =>
                        replaceVendor({
                          ...row,
                          sellPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                        })
                      }
                      className="w-full bg-gray-50 rounded-xl px-3 py-2 font-fa-num"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.refundPercent}
                      onChange={(e) =>
                        replaceVendor({
                          ...row,
                          refundPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                        })
                      }
                      className="w-full bg-gray-50 rounded-xl px-3 py-2 font-fa-num"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.expenseAccount}
                      onChange={(e) =>
                        replaceVendor({ ...row, expenseAccount: e.target.value })
                      }
                      className="w-full bg-gray-50 rounded-xl px-3 py-2"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.active}
                      onChange={(e) => replaceVendor({ ...row, active: e.target.checked })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeVendor(row.id)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
