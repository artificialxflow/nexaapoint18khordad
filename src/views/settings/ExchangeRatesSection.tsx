'use client';

import React, { useState } from 'react';
import { Coins, Pencil, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '@/src/context/SettingsContext';
import type { ExchangeRateRow } from '@/src/types/settings';

const emptyRow = (): Omit<ExchangeRateRow, 'id'> & { id?: string } => ({
  fromCurrency: 'USD',
  toCurrency: 'IRR',
  rate: 1,
  effectiveDate: '',
});

export default function ExchangeRatesSection() {
  const { exchangeRates, upsertExchangeRate, removeExchangeRate } = useSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyRow());

  const openNew = () => {
    setForm(emptyRow());
    setModalOpen(true);
  };

  const openEdit = (row: ExchangeRateRow) => {
    setForm({
      id: row.id,
      fromCurrency: row.fromCurrency,
      toCurrency: row.toCurrency,
      rate: row.rate,
      effectiveDate: row.effectiveDate,
    });
    setModalOpen(true);
  };

  const save = () => {
    upsertExchangeRate(form);
    setModalOpen(false);
    setForm(emptyRow());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <Coins className="text-nexa-accent" size={22} />
        <h2 className="text-lg font-black text-gray-900">جدول نرخ تبدیل ارز</h2>
        <p className="text-xs text-gray-500 mr-auto">مودال ویرایش مطابق ۰۶</p>
        <button type="button" onClick={openNew} className="nexa-btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <Plus size={16} />
          ردیف جدید
        </button>
      </div>

      <div className="nexa-card overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-nexa-border text-xs text-gray-500">
              <th className="px-4 py-3">ارز مبنا</th>
              <th className="px-4 py-3">ارز مقصد</th>
              <th className="px-4 py-3">نرخ</th>
              <th className="px-4 py-3">تاریخ اعتبار</th>
              <th className="px-4 py-3">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-nexa-border">
            {exchangeRates.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-bold">{r.fromCurrency}</td>
                <td className="px-4 py-3">{r.toCurrency}</td>
                <td className="px-4 py-3 font-fa-num">{r.rate.toLocaleString('fa-IR')}</td>
                <td className="px-4 py-3 font-fa-num">{r.effectiveDate || '—'}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button type="button" onClick={() => openEdit(r)} className="p-2 rounded-lg text-nexa-accent hover:bg-nexa-accent/10">
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => removeExchangeRate(r.id)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-nexa-border overflow-hidden"
            >
              <div className="p-4 border-b border-nexa-border flex items-center justify-between">
                <h3 className="font-black text-gray-900">جدول تبدیل نرخ ارز</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">از ارز</label>
                    <input
                      value={form.fromCurrency}
                      onChange={(e) => setForm((f) => ({ ...f, fromCurrency: e.target.value.toUpperCase() }))}
                      className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">به ارز</label>
                    <input
                      value={form.toCurrency}
                      onChange={(e) => setForm((f) => ({ ...f, toCurrency: e.target.value.toUpperCase() }))}
                      className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">نرخ تبدیل</label>
                  <input
                    type="number"
                    value={form.rate}
                    onChange={(e) => setForm((f) => ({ ...f, rate: Number(e.target.value) || 0 }))}
                    className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">تاریخ اعتبار</label>
                  <input
                    value={form.effectiveDate}
                    onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                    className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm font-fa-num"
                    placeholder="۱۴۰۴/۰۸/۰۱"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={save} className="flex-1 nexa-btn-primary py-2.5 text-sm font-bold">
                    ذخیره
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 bg-gray-100 rounded-xl py-2.5 text-sm font-bold"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
