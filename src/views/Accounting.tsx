import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Calculator, 
  Calendar,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const initialEntries = [
  { id: 'ACC-101', title: 'سند افتتاحیه سال ۱۴۰۴', date: '۱۴۰۴/۰۱/۰۱', total: '۵,۴۰۰,۰۰۰,۰۰۰', status: 'posted' },
  { id: 'ACC-102', title: 'سند حقوق فروردین ماه', date: '۱۴۰۴/۰۱/۳۱', total: '۸۵۰,۰۰۰,۰۰۰', status: 'draft' },
  { id: 'ACC-103', title: 'سند خرید مواد اولیه - فاکتور ۱۲۴', date: '۱۴۰۴/۰۲/۰۵', total: '۱۲۰,۰۰۰,۰۰۰', status: 'posted' },
];

const tabs = [
  { id: 'entries', label: 'لیست اسناد' },
  { id: 'opening', label: 'تراز افتتاحیه' },
  { id: 'closing', label: 'بستن سال مالی' },
  { id: 'chart', label: 'جدول حساب‌ها' },
  { id: 'consolidation', label: 'تجمیع اسناد' },
];

export default function Accounting() {
  const [activeTab, setActiveTab] = useState('entries');
  const [entriesList, setEntriesList] = useState(initialEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrialBalanceOpen, setIsTrialBalanceOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', total: '', status: 'draft' });

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = {
      id: `ACC-${100 + entriesList.length + 1}`,
      ...newEntry,
      date: new Date().toLocaleDateString('fa-IR'),
    };
    setEntriesList([entry, ...entriesList]);
    setIsModalOpen(false);
    setNewEntry({ title: '', total: '', status: 'draft' });
  };

  const filteredEntries = entriesList.filter(entry => 
    entry.title.includes(searchQuery) || entry.id.includes(searchQuery)
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'entries':
        return (
          <motion.div
            key="entries"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="nexa-card overflow-hidden"
          >
            <div className="p-6 border-b border-nexa-border flex items-center justify-between bg-gray-50/50">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در اسناد..." 
                  className="w-full bg-white border border-nexa-border rounded-xl py-2 pr-10 pl-4 text-sm" 
                />
              </div>
              <button className="p-2 text-gray-500 hover:bg-white rounded-lg border border-transparent hover:border-nexa-border transition-all">
                <Filter size={18} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-nexa-border">
                    <th className="px-6 py-4">شماره سند</th>
                    <th className="px-6 py-4">شرح سند</th>
                    <th className="px-6 py-4">تاریخ</th>
                    <th className="px-6 py-4">مبلغ کل (تومان)</th>
                    <th className="px-6 py-4">وضعیت</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexa-border">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 font-fa-num">{entry.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{entry.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-fa-num">{entry.date}</td>
                      <td className="px-6 py-4 text-sm font-black text-gray-900 font-fa-num">{entry.total}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          entry.status === 'posted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {entry.status === 'posted' ? 'قطعی شده' : 'پیش‌نویس'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <button className="p-1.5 text-gray-400 hover:text-nexa-accent transition-all">
                          <ChevronLeft size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      case 'chart':
        return (
          <motion.div
            key="chart"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[
              { code: '1', title: 'دارایی‌های جاری', balance: '۸,۵۰۰,۰۰۰,۰۰۰', type: 'بدهکار' },
              { code: '2', title: 'بدهی‌های جاری', balance: '۳,۲۰۰,۰۰۰,۰۰۰', type: 'بستانکار' },
              { code: '3', title: 'سرمایه', balance: '۵,۰۰۰,۰۰۰,۰۰۰', type: 'بستانکار' },
              { code: '4', title: 'درآمدها', balance: '۱۲,۴۰۰,۰۰۰,۰۰۰', type: 'بستانکار' },
              { code: '5', title: 'هزینه‌ها', balance: '۴,۱۰۰,۰۰۰,۰۰۰', type: 'بدهکار' },
              { code: '6', title: 'دارایی‌های ثابت', balance: '۱۵,۰۰۰,۰۰۰,۰۰۰', type: 'بدهکار' },
            ].map((item) => (
              <div key={item.code} className="nexa-card p-6 flex justify-between items-center group hover:border-nexa-accent transition-colors">
                <div>
                  <p className="text-[10px] font-bold text-nexa-accent mb-1 font-fa-num">کد کل: {item.code}</p>
                  <h4 className="text-sm font-black text-gray-900">{item.title}</h4>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded mt-2 inline-block ${item.type === 'بدهکار' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                    ماهیت {item.type}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 mb-1">مانده حساب</p>
                  <p className="text-sm font-black text-gray-900 font-fa-num">{item.balance}</p>
                </div>
              </div>
            ))}
          </motion.div>
        );
      case 'opening':
        return (
          <motion.div
            key="opening"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="nexa-card p-8 text-center bg-blue-50/30 border-blue-100">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">تراز افتتاحیه سال مالی ۱۴۰۴</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                تراز افتتاحیه بر اساس مانده‌های منتقل شده از سال مالی قبل (۱۴۰۳) تنظیم شده است.
              </p>
              <div className="flex justify-center gap-4">
                <div className="px-6 py-3 bg-white rounded-xl border border-nexa-border">
                  <p className="text-[10px] text-gray-400 mb-1">جمع بدهکار</p>
                  <p className="text-sm font-black text-gray-900 font-fa-num">۱۲,۴۵۰,۰۰۰,۰۰۰</p>
                </div>
                <div className="px-6 py-3 bg-white rounded-xl border border-nexa-border">
                  <p className="text-[10px] text-gray-400 mb-1">جمع بستانکار</p>
                  <p className="text-sm font-black text-gray-900 font-fa-num">۱۲,۴۵۰,۰۰۰,۰۰۰</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'closing':
        return (
          <motion.div
            key="closing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto nexa-card p-8 border-rose-100"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                <X size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">بستن سال مالی</h3>
                <p className="text-xs text-gray-500">انتقال مانده‌ها به حساب‌های دائمی و صدور سند اختتامیه</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                <p className="text-xs text-amber-700 leading-relaxed">
                  قبل از بستن سال مالی، اطمینان حاصل کنید که تمامی اسناد موقت تایید شده و مغایرت‌های بانکی رفع شده باشند. این عملیات غیرقابل بازگشت است.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">تعداد اسناد تایید نشده:</span>
                  <span className="text-sm font-bold text-rose-500 font-fa-num">۰ عدد</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">سود/زیان انباشته:</span>
                  <span className="text-sm font-bold text-emerald-600 font-fa-num">+۸۵۰,۰۰۰,۰۰۰ تومان</span>
                </div>
              </div>
              <button className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-sm hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200">
                شروع عملیات بستن سال مالی
              </button>
            </div>
          </motion.div>
        );
      case 'consolidation':
        return (
          <motion.div
            key="consolidation"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="nexa-card p-6">
              <h4 className="text-sm font-bold text-gray-900 mb-6">تجمیع اسناد روزانه</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">از تاریخ</label>
                  <input type="text" placeholder="۱۴۰۴/۰۱/۰۱" className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-fa-num" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">تا تاریخ</label>
                  <input type="text" placeholder="۱۴۰۴/۱۲/۲۹" className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-fa-num" />
                </div>
                <div className="flex items-end">
                  <button className="w-full nexa-btn-primary py-3">اجرای تجمیع</button>
                </div>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">حسابداری و تراز مالی</h1>
          <p className="text-gray-500 mt-1">مدیریت اسناد حسابداری، سرفصل‌ها و گزارشات قانونی</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsTrialBalanceOpen(true)}
            className="bg-white border border-nexa-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Calculator size={18} />
            تراز آزمایشی
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="nexa-btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            ثبت سند جدید
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-nexa-accent shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {renderTabContent()}
      </AnimatePresence>

      {/* Trial Balance Modal */}
      <AnimatePresence>
        {isTrialBalanceOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrialBalanceOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-nexa-accent/10 text-nexa-accent rounded-xl">
                    <Calculator size={20} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">گزارش تراز آزمایشی (۸ ستونی)</h3>
                </div>
                <button onClick={() => setIsTrialBalanceOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-nexa-border">
                      <th rowSpan={2} className="px-4 py-4 border-l border-nexa-border">نام حساب</th>
                      <th colSpan={2} className="px-4 py-2 text-center border-l border-nexa-border">گردش دوره</th>
                      <th colSpan={2} className="px-4 py-2 text-center border-l border-nexa-border">مانده دوره</th>
                      <th colSpan={2} className="px-4 py-2 text-center">مانده نهایی</th>
                    </tr>
                    <tr className="bg-gray-50 border-b border-nexa-border">
                      <th className="px-4 py-2 border-l border-nexa-border">بدهکار</th>
                      <th className="px-4 py-2 border-l border-nexa-border">بستانکار</th>
                      <th className="px-4 py-2 border-l border-nexa-border">بدهکار</th>
                      <th className="px-4 py-2 border-l border-nexa-border">بستانکار</th>
                      <th className="px-4 py-2 border-l border-nexa-border">بدهکار</th>
                      <th className="px-4 py-2">بستانکار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexa-border font-fa-num">
                    {[
                      { name: 'بانک ملت', d1: '۴۵۰,۰۰۰', c1: '۱۲۰,۰۰۰', d2: '۳۳۰,۰۰۰', c2: '۰', d3: '۳۳۰,۰۰۰', c3: '۰' },
                      { name: 'حساب‌های دریافتنی', d1: '۸۰۰,۰۰۰', c1: '۰', d2: '۸۰۰,۰۰۰', c2: '۰', d3: '۸۰۰,۰۰۰', c3: '۰' },
                      { name: 'صندوق مرکزی', d1: '۱۵۰,۰۰۰', c1: '۸۰,۰۰۰', d2: '۷۰,۰۰۰', c2: '۰', d3: '۷۰,۰۰۰', c3: '۰' },
                      { name: 'حساب‌های پرداختنی', d1: '۰', c1: '۵۰۰,۰۰۰', d2: '۰', c2: '۵۰۰,۰۰۰', d3: '۰', c3: '۵۰۰,۰۰۰' },
                      { name: 'سرمایه', d1: '۰', c1: '۱,۰۰۰,۰۰۰', d2: '۰', c2: '۱,۰۰۰,۰۰۰', d3: '۰', c3: '۱,۰۰۰,۰۰۰' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-bold border-l border-nexa-border">{row.name}</td>
                        <td className="px-4 py-3 border-l border-nexa-border">{row.d1}</td>
                        <td className="px-4 py-3 border-l border-nexa-border">{row.c1}</td>
                        <td className="px-4 py-3 border-l border-nexa-border">{row.d2}</td>
                        <td className="px-4 py-3 border-l border-nexa-border">{row.c2}</td>
                        <td className="px-4 py-3 border-l border-nexa-border">{row.d3}</td>
                        <td className="px-4 py-3">{row.c3}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-black text-gray-900 border-t-2 border-nexa-border font-fa-num">
                      <td className="px-4 py-4 border-l border-nexa-border">جمع کل:</td>
                      <td className="px-4 py-4 border-l border-nexa-border">۱,۴۰۰,۰۰۰</td>
                      <td className="px-4 py-4 border-l border-nexa-border">۱,۷۰۰,۰۰۰</td>
                      <td className="px-4 py-4 border-l border-nexa-border">۱,۲۰۰,۰۰۰</td>
                      <td className="px-4 py-4 border-l border-nexa-border">۱,۵۰۰,۰۰۰</td>
                      <td className="px-4 py-4 border-l border-nexa-border">۱,۲۰۰,۰۰۰</td>
                      <td className="px-4 py-4">۱,۵۰۰,۰۰۰</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="p-6 bg-gray-50 border-t border-nexa-border flex justify-end gap-3">
                <button className="px-6 py-2 bg-white border border-nexa-border rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors">چاپ گزارش</button>
                <button onClick={() => setIsTrialBalanceOpen(false)} className="px-6 py-2 bg-nexa-accent text-white rounded-xl text-xs font-bold hover:bg-nexa-accent/90 transition-colors">بستن</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Entry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">ثبت سند حسابداری جدید</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddEntry} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">شرح سند</label>
                  <input 
                    required
                    type="text" 
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                    placeholder="مثال: سند حقوق فروردین"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">مبلغ کل (تومان)</label>
                    <input 
                      required
                      type="text" 
                      value={newEntry.total}
                      onChange={(e) => setNewEntry({...newEntry, total: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-fa-num focus:ring-2 focus:ring-nexa-accent/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">وضعیت</label>
                    <select 
                      value={newEntry.status}
                      onChange={(e) => setNewEntry({...newEntry, status: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20"
                    >
                      <option value="draft">پیش‌نویس</option>
                      <option value="posted">قطعی شده</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 nexa-btn-primary py-3">ثبت سند</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">انصراف</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

