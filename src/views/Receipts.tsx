'use client';

import React, { useMemo, useState } from 'react';
import { Cloud, Copy, Plus, Trash2, Upload } from 'lucide-react';
import { NcFilePickerModal } from '@/src/components/nextcloud/NcFilePickerModal';
import { ncPathForReceipt } from '@/src/lib/nextcloud/paths';
import { openNcFile, uploadFileToNextcloud } from '@/src/lib/nextcloud/uploadClient';
import { newId, useCatalog } from '@/src/context/CatalogContext';
import type { MoneyDocumentAttachment, MoneyDocumentLine } from '@/src/types/person';
import type { NcFileRef } from '@/src/types/nextcloud';

const EMPTY_LINE: MoneyDocumentLine = {
  id: '',
  personId: '',
  amount: 0,
  note: '',
};

export default function Receipts() {
  const { people, receipts, addReceipt } = useCatalog();
  const [number, setNumber] = useState('');
  const [date, setDate] = useState('1405/01/21');
  const [project, setProject] = useState('');
  const [newProject, setNewProject] = useState('');
  const [description, setDescription] = useState('');
  const [notesText, setNotesText] = useState('');
  const [currency, setCurrency] = useState('IRR');
  const [attachments, setAttachments] = useState<MoneyDocumentAttachment[]>([]);
  const [ncPickerOpen, setNcPickerOpen] = useState(false);
  const [lines, setLines] = useState<MoneyDocumentLine[]>([{ ...EMPTY_LINE, id: newId() }]);

  const receiptNcPath = useMemo(
    () => ncPathForReceipt(number.trim() || 'draft'),
    [number]
  );

  const total = useMemo(
    () => lines.reduce((acc, line) => acc + (line.amount || 0), 0),
    [lines]
  );

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE, id: newId() }]);

  const patchLine = (id: string, patch: Partial<MoneyDocumentLine>) =>
    setLines((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const removeLine = (id: string) => setLines((prev) => prev.filter((row) => row.id !== id));

  const projectOptions = useMemo(() => {
    const set = new Set<string>();
    receipts.forEach((doc) => {
      if (doc.project) set.add(doc.project);
    });
    if (project) set.add(project);
    return [...set];
  }, [receipts, project]);

  const readAttachment = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('خواندن فایل انجام نشد'));
      reader.readAsDataURL(file);
    });

  const addAttachmentEntry = (entry: MoneyDocumentAttachment) => {
    setAttachments((prev) => [...prev, entry]);
  };

  const handleAttach = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const ref = await uploadFileToNextcloud(file, receiptNcPath);
    if (ref) {
      addAttachmentEntry({
        id: newId(),
        name: ref.name,
        mimeType: ref.mimeType,
        ncRef: ref,
        createdAt: new Date().toISOString(),
      });
    } else {
      const dataUrl = await readAttachment(file);
      addAttachmentEntry({
        id: newId(),
        name: file.name,
        mimeType: file.type,
        dataUrl,
        createdAt: new Date().toISOString(),
      });
    }
    ev.target.value = '';
  };

  const onNcSelect = (ref: NcFileRef) => {
    addAttachmentEntry({
      id: newId(),
      name: ref.name,
      mimeType: ref.mimeType,
      ncRef: ref,
      createdAt: new Date().toISOString(),
    });
  };

  const cloneLastDoc = () => {
    const last = receipts[0];
    if (!last) return;
    setProject(last.project || '');
    setDescription(last.description || '');
    setCurrency(last.currency);
    setLines(last.lines.map((line) => ({ ...line, id: newId() })));
    setNotesText((last.notes || []).join('\n'));
    setAttachments((last.attachments || []).map((x) => ({ ...x, id: newId() })));
  };

  const save = () => {
    if (!number.trim()) return;
    const validLines = lines.filter((line) => line.amount > 0);
    if (!validLines.length) return;
    const resolvedProject = newProject.trim() || project || undefined;
    addReceipt({
      id: newId(),
      number,
      date,
      project: resolvedProject,
      description: description || undefined,
      currency,
      lines: validLines,
      notes: notesText.split('\n').map((x) => x.trim()).filter(Boolean),
      attachments,
      history: [{ id: newId(), action: 'ایجاد سند دریافت', at: new Date().toISOString(), by: 'کاربر جاری' }],
    });
    setNumber('');
    setProject('');
    setNewProject('');
    setDescription('');
    setNotesText('');
    setAttachments([]);
    setLines([{ ...EMPTY_LINE, id: newId() }]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900">دریافت</h1>
        <p className="text-sm text-gray-500 mt-1">ثبت سند دریافت — پیوست محلی یا Nextcloud</p>
      </div>

      <div className="nexa-card p-5 space-y-4">
        <div className="grid md:grid-cols-4 gap-3">
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="شماره"
            className="bg-gray-50 rounded-xl px-3 py-2 text-sm"
          />
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="تاریخ"
            className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num"
          />
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="bg-gray-50 rounded-xl px-3 py-2 text-sm"
          >
            <option value="">انتخاب پروژه</option>
            {projectOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-gray-50 rounded-xl px-3 py-2 text-sm"
          >
            <option value="IRR">IRR - ریال ایران</option>
          </select>
        </div>
        <input
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          placeholder="یا پروژه جدید ایجاد کن"
          className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="شرح"
          className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm min-h-16"
        />
        <textarea
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          placeholder="نوت رسید (هر خط یک نوت)"
          className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm min-h-16"
        />
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-600 flex items-center gap-2">
            <Upload size={14} /> اتچ رسید
          </label>
          <div className="flex flex-wrap gap-2">
            <label className="text-xs font-bold bg-gray-100 px-3 py-2 rounded-xl cursor-pointer">
              آپلود محلی / NC
              <input type="file" onChange={handleAttach} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => setNcPickerOpen(true)}
              className="text-xs font-bold bg-gray-100 px-3 py-2 rounded-xl flex items-center gap-1"
            >
              <Cloud size={14} />
              انتخاب از Nextcloud
            </button>
          </div>
          {attachments.length > 0 && (
            <ul className="bg-gray-50 rounded-xl p-2 text-xs space-y-1">
              {attachments.map((att) => (
                <li key={att.id} className="flex items-center gap-2">
                  {att.ncRef ? (
                    <button
                      type="button"
                      className="text-nexa-accent font-bold hover:underline"
                      onClick={() => openNcFile(att.ncRef!)}
                    >
                      {att.name}
                    </button>
                  ) : (
                    <span>{att.name} (محلی)</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-2">
          {lines.map((line) => (
            <div key={line.id} className="grid md:grid-cols-12 gap-2 items-center">
              <select
                value={line.personId}
                onChange={(e) => patchLine(line.id, { personId: e.target.value })}
                className="md:col-span-4 bg-gray-50 rounded-xl px-3 py-2 text-xs"
              >
                <option value="">شخص</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.displayName}
                  </option>
                ))}
              </select>
              <input
                value={line.amount || ''}
                onChange={(e) => patchLine(line.id, { amount: Number(e.target.value) || 0 })}
                placeholder="مبلغ"
                className="md:col-span-3 bg-gray-50 rounded-xl px-3 py-2 text-xs font-fa-num"
              />
              <input
                value={line.note || ''}
                onChange={(e) => patchLine(line.id, { note: e.target.value })}
                placeholder="شرح ردیف"
                className="md:col-span-4 bg-gray-50 rounded-xl px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                className="md:col-span-1 p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={cloneLastDoc}
            className="px-3 py-2 rounded-xl bg-white border border-nexa-border text-gray-700 text-xs font-bold flex items-center gap-1"
          >
            <Copy size={14} />
            کپی از آخرین رسید
          </button>
          <button
            type="button"
            onClick={addLine}
            className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1"
          >
            <Plus size={14} />
            افزودن آیتم
          </button>
          <p className="text-xs font-bold text-emerald-700 font-fa-num">
            مجموع: {total.toLocaleString('fa-IR')} ریال
          </p>
          <button type="button" onClick={save} className="nexa-btn-primary px-4 py-2 text-xs">
            افزودن دریافت
          </button>
        </div>
      </div>

      <NcFilePickerModal
        open={ncPickerOpen}
        onClose={() => setNcPickerOpen(false)}
        onSelect={onNcSelect}
        initialPath={receiptNcPath}
      />
    </div>
  );
}
