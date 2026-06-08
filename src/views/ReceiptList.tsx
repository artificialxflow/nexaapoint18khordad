import React, { useMemo, useState } from 'react';
import { useCatalog } from '@/src/context/CatalogContext';

export default function ReceiptList() {
  const { receipts, people } = useCatalog();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pdfTemplate, setPdfTemplate] = useState<'compact' | 'detailed'>('compact');

  const rows = useMemo(() => {
    return receipts
      .filter((doc) => doc.number.includes(search) || (doc.description || '').includes(search))
      .map((doc) => ({
        ...doc,
        total: doc.lines.reduce((acc, line) => acc + line.amount, 0),
      }));
  }, [receipts, search]);

  const personName = (id?: string) =>
    people.find((p) => p.id === id)?.displayName || '—';
  const selectedDoc = rows.find((x) => x.id === selectedId) || null;

  const exportPdf = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const body = rows
      .map(
        (doc) => `
        <tr>
          <td>${doc.number}</td>
          <td>${doc.date}</td>
          <td>${personName(doc.lines[0]?.personId)}</td>
          <td>${doc.project || '—'}</td>
          <td>${doc.total.toLocaleString('fa-IR')}</td>
          ${pdfTemplate === 'detailed' ? `<td>${doc.description || '—'}</td>` : ''}
        </tr>`
      )
      .join('');
    w.document.write(`
      <html><head><title>Receipt List</title></head>
      <body dir="rtl" style="font-family:Tahoma;padding:16px;">
      <h2>لیست دریافت‌ها</h2>
      <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;">
        <thead><tr><th>شماره</th><th>تاریخ</th><th>شخص</th><th>پروژه</th><th>مبلغ</th>${pdfTemplate === 'detailed' ? '<th>شرح</th>' : ''}</tr></thead>
        <tbody>${body}</tbody>
      </table>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900">لیست دریافت‌ها</h1>
        <p className="text-sm text-gray-500 mt-1">نمایش اسناد دریافت ثبت‌شده</p>
      </div>
      <div className="nexa-card overflow-hidden">
        <div className="p-4 border-b border-nexa-border">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو شماره/شرح"
              className="w-full md:w-80 bg-gray-50 rounded-xl px-3 py-2 text-sm"
            />
            <select value={pdfTemplate} onChange={(e) => setPdfTemplate(e.target.value as 'compact' | 'detailed')} className="bg-gray-50 rounded-xl px-3 py-2 text-sm">
              <option value="compact">قالب فشرده PDF</option>
              <option value="detailed">قالب کامل PDF</option>
            </select>
            <button type="button" onClick={exportPdf} className="bg-gray-900 text-white rounded-xl px-3 py-2 text-xs font-bold">
              خروجی PDF
            </button>
          </div>
        </div>
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50/70 border-b border-nexa-border text-xs text-gray-500">
              <th className="px-4 py-3">شماره</th>
              <th className="px-4 py-3">تاریخ</th>
              <th className="px-4 py-3">شخص</th>
              <th className="px-4 py-3">شرح</th>
              <th className="px-4 py-3">مبلغ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-nexa-border">
            {rows.map((doc) => (
              <tr key={doc.id} className="text-sm hover:bg-gray-50/40 cursor-pointer" onClick={() => setSelectedId(doc.id)}>
                <td className="px-4 py-3 font-fa-num text-blue-700">{doc.number}</td>
                <td className="px-4 py-3 font-fa-num">{doc.date}</td>
                <td className="px-4 py-3">{personName(doc.lines[0]?.personId)}</td>
                <td className="px-4 py-3">{doc.description || '—'}</td>
                <td className="px-4 py-3 font-fa-num font-bold">
                  {doc.total.toLocaleString('fa-IR')} ریال
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectedDoc && (
          <div className="border-t border-nexa-border p-4 bg-gray-50 space-y-3">
            <p className="text-sm font-black text-gray-800">جزئیات سند {selectedDoc.number}</p>
            <div className="grid md:grid-cols-3 gap-2 text-xs">
              <div className="bg-white rounded-xl p-2">
                <p className="text-gray-500">پروژه</p>
                <p>{selectedDoc.project || '—'}</p>
              </div>
              <div className="bg-white rounded-xl p-2">
                <p className="text-gray-500">نوت‌ها</p>
                <p>{(selectedDoc.notes || []).join(' | ') || '—'}</p>
              </div>
              <div className="bg-white rounded-xl p-2">
                <p className="text-gray-500">اتچمنت</p>
                <p>{selectedDoc.attachments?.length || 0} فایل</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="text-xs font-bold text-gray-700 mb-2">تاریخچه تغییرات</p>
              <ul className="space-y-1 text-xs text-gray-600">
                {(selectedDoc.history || []).map((event) => (
                  <li key={event.id}>• {event.at} - {event.action}</li>
                ))}
                {(!selectedDoc.history || selectedDoc.history.length === 0) && <li>ثبت تاریخچه‌ای وجود ندارد.</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
