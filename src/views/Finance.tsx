import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  FileText, 
  MoreHorizontal,
  Download,
  Plus,
  AlertCircle,
  Search,
  CheckCircle2,
  ChevronLeft,
  Calculator,
  X,
  Wallet,
  ArrowLeftRight,
  History,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  Banknote,
  Stamp,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';

const initialTransactions = [
  { id: 'TX-5021', type: 'درآمد', category: 'فروش نهایی', amount: '۴۵,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۲۸', status: 'تایید شده' },
  { id: 'TX-5022', type: 'هزینه', category: 'خرید پارچه', amount: '۱۲,۸۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۲۸', status: 'در انتظار' },
  { id: 'TX-5023', type: 'درآمد', category: 'پیش‌پرداخت', amount: '۱۵,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۲۷', status: 'تایید شده' },
  { id: 'TX-5024', type: 'هزینه', category: 'حقوق پرسنل', amount: '۸۵,۰۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۲۵', status: 'تایید شده' },
];

const initialSettlements = [
  { name: 'مبلمان کلاسیک آریا', count: 5, gross: '۱۲۰,۰۰۰,۰۰۰', commission: '۱۸,۰۰۰,۰۰۰', net: '۱۰۲,۰۰۰,۰۰۰', status: 'آماده پرداخت' },
  { name: 'صنایع چوبی نوین', count: 3, gross: '۴۵,۰۰۰,۰۰۰', commission: '۶,۷۵۰,۰۰۰', net: '۳۸,۲۵۰,۰۰۰', status: 'در انتظار تایید' },
];

const initialBanks = [
  { id: 'B1', name: 'بانک ملت - شعبه مرکزی', account: '۵۸۷۴-۹۶۳۲-۱۴۵۸-۷۸۵۲', balance: '۱,۲۵۰,۰۰۰,۰۰۰' },
  { id: 'B2', name: 'بانک سامان - شعبه جردن', account: '۶۲۱۹-۸۶۱۰-۴۵۷۸-۹۶۳۲', balance: '۸۵۰,۰۰۰,۰۰۰' },
];

const initialCash = [
  { id: 'C1', name: 'صندوق مرکزی', balance: '۴۵,۰۰۰,۰۰۰', manager: 'احمدی' },
  { id: 'C2', name: 'تنخواه فروشگاه', balance: '۱۲,۵۰۰,۰۰۰', manager: 'رضایی' },
];

const initialPettyCash = [
  { id: 'P1', name: 'تنخواه دفتر مرکزی', limit: '۵۰,۰۰۰,۰۰۰', spent: '۳۲,۴۰۰,۰۰۰', holder: 'مریم سعیدی' },
  { id: 'P2', name: 'تنخواه کارگاه تولید', limit: '۱۰۰,۰۰۰,۰۰۰', spent: '۸۵,۰۰۰,۰۰۰', holder: 'جواد مرادی' },
];

const initialChecksReceived = [
  { id: 'CH-101', bank: 'ملی', amount: '۱۲۰,۰۰۰,۰۰۰', dueDate: '۱۴۰۴/۱۲/۱۵', drawer: 'شرکت آوا', status: 'در جریان' },
  { id: 'CH-102', bank: 'صادرات', amount: '۴۵,۰۰۰,۰۰۰', dueDate: '۱۴۰۴/۱۲/۲۰', drawer: 'علی محمدی', status: 'وصول شده' },
];

const initialChecksPaid = [
  { id: 'CHP-501', bank: 'ملت', amount: '۸۵,۰۰۰,۰۰۰', dueDate: '۱۴۰۴/۱۲/۱۰', payee: 'تامین قطعات البرز', status: 'پاس شده' },
  { id: 'CHP-502', bank: 'سامان', amount: '۲۱۰,۰۰۰,۰۰۰', dueDate: '۱۴۰۵/۰۱/۱۵', payee: 'اجاره انبار مرکزی', status: 'در انتظار' },
];

const tabs = [
  { id: 'overview', label: 'پیش‌خوان مالی' },
  { id: 'banks', label: 'بانک‌ها' },
  { id: 'cash', label: 'صندوق‌ها' },
  { id: 'settlements', label: 'تسویه فروشندگان' },
  { id: 'petty_cash', label: 'تنخواه گردان‌ها' },
  { id: 'transfers', label: 'انتقال وجه' },
  { id: 'checks_received', label: 'چک‌های دریافتی' },
  { id: 'checks_paid', label: 'چک‌های پرداختی' },
];

export default function Finance() {
  const [activeTab, setActiveTab] = useState('overview');
  const [transactionsList, setTransactionsList] = useState(initialTransactions);
  const [settlementsList, setSettlementsList] = useState(initialSettlements);
  const [banksList, setBanksList] = useState(initialBanks);
  const [cashList, setCashList] = useState(initialCash);
  const [pettyCashList, setPettyCashList] = useState(initialPettyCash);
  const [checksReceived, setChecksReceived] = useState(initialChecksReceived);
  const [checksPaid, setChecksPaid] = useState(initialChecksPaid);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isBalanceSheetModalOpen, setIsBalanceSheetModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ type: 'درآمد', category: '', amount: '', date: '۱۴۰۴/۱۲/۰۱' });

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const tx = {
      id: `TX-${Math.floor(Math.random() * 9000) + 1000}`,
      ...newTransaction,
      status: 'در انتظار'
    };
    setTransactionsList([tx, ...transactionsList]);
    setIsTransactionModalOpen(false);
    setNewTransaction({ type: 'درآمد', category: '', amount: '', date: '۱۴۰۴/۱۲/۰۱' });
  };

  const filteredTransactions = transactionsList.filter(tx => 
    tx.category.includes(searchQuery) || tx.id.includes(searchQuery)
  );

  const filteredSettlements = settlementsList.filter(s => 
    s.name.includes(searchQuery)
  );

  const filteredBanks = banksList.filter(b => 
    b.name.includes(searchQuery) || b.account.includes(searchQuery)
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'banks':
        return (
          <motion.div
            key="banks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredBanks.map((bank) => (
              <div key={bank.id} className="nexa-card p-6 group hover:border-nexa-accent transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <CreditCard size={24} />
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">{bank.name}</h4>
                <p className="text-[10px] text-gray-400 font-fa-num mb-6">{bank.account}</p>
                <div className="pt-6 border-t border-nexa-border flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">موجودی فعلی</p>
                    <p className="text-lg font-black text-gray-900 font-fa-num">{bank.balance} <span className="text-[10px] font-normal opacity-50">تومان</span></p>
                  </div>
                  <button className="text-xs font-bold text-nexa-accent hover:underline">گردش حساب</button>
                </div>
              </div>
            ))}
            <button 
              onClick={() => setIsBankModalOpen(true)}
              className="nexa-card p-6 border-dashed border-2 border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:text-nexa-accent hover:border-nexa-accent transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-nexa-accent/5">
                <Plus size={24} />
              </div>
              <p className="text-xs font-bold">افزودن حساب بانکی جدید</p>
            </button>
          </motion.div>
        );
      case 'cash':
        return (
          <motion.div
            key="cash"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {cashList.map((cash) => (
              <div key={cash.id} className="nexa-card p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Wallet size={24} />
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">{cash.name}</h4>
                <p className="text-[10px] text-gray-400 mb-6">مسئول: {cash.manager}</p>
                <div className="pt-6 border-t border-nexa-border">
                  <p className="text-[10px] text-gray-400 mb-1">موجودی صندوق</p>
                  <p className="text-lg font-black text-gray-900 font-fa-num">{cash.balance} تومان</p>
                </div>
              </div>
            ))}
            <button className="nexa-card p-6 border-dashed border-2 border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:text-nexa-accent hover:border-nexa-accent transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-nexa-accent/5">
                <Plus size={24} />
              </div>
              <p className="text-xs font-bold">تعریف صندوق جدید</p>
            </button>
          </motion.div>
        );
      case 'settlements':
        return (
          <motion.div
            key="settlements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="nexa-card p-6 border-amber-100 bg-amber-50/20">
                <h4 className="text-sm font-bold text-gray-900 mb-4">گزارش تسویه فروشندگان (ماه جاری)</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">کل مبلغ قابل تسویه:</span>
                    <span className="text-sm font-black text-gray-900 font-fa-num">۴۵۰,۰۰۰,۰۰۰ تومان</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">تسویه شده:</span>
                    <span className="text-sm font-black text-emerald-600 font-fa-num">۲۸۰,۰۰۰,۰۰۰ تومان</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">مانده در انتظار:</span>
                    <span className="text-sm font-black text-rose-600 font-fa-num">۱۷۰,۰۰۰,۰۰۰ تومان</span>
                  </div>
                </div>
              </div>
              <div className="nexa-card p-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4">قوانین خودکار تسویه</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-nexa-accent"></div>
                    ۱۰ روز پس از تحویل نهایی کالا
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-nexa-accent"></div>
                    کسر خودکار کمیسیون پلتفرم (۱۵٪)
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-nexa-accent"></div>
                    واریز به کیف پول سهم‌دار فروش (قرارداد اجرای فاکتور)
                  </div>
                </div>
              </div>
            </div>

            <div className="nexa-card overflow-hidden">
              <div className="p-4 border-b border-nexa-border flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900">لیست تسویه حساب‌ها</h3>
                <div className="relative w-48">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی طرف تسویه (سهم فروش)..." 
                    className="w-full bg-gray-50 border-none rounded-xl py-1.5 pr-9 pl-3 text-xs" 
                  />
                </div>
              </div>
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-nexa-border">
                    <th className="px-6 py-4">طرف تسویه / سهم فروش</th>
                    <th className="px-6 py-4">تعداد فاکتور</th>
                    <th className="px-6 py-4">مبلغ ناخالص</th>
                    <th className="px-6 py-4">کمیسیون</th>
                    <th className="px-6 py-4">مبلغ خالص تسویه</th>
                    <th className="px-6 py-4">وضعیت</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexa-border">
                  {filteredSettlements.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-fa-num">{item.count}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-fa-num">{item.gross}</td>
                      <td className="px-6 py-4 text-xs text-rose-500 font-fa-num">{item.commission}</td>
                      <td className="px-6 py-4 text-sm font-black text-emerald-600 font-fa-num">{item.net}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          item.status === 'آماده پرداخت' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <button className="nexa-btn-primary py-1.5 px-4 text-[10px]">تسویه نهایی</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      case 'petty_cash':
        return (
          <motion.div
            key="petty_cash"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {pettyCashList.map((petty) => {
              const spentPercent = (parseInt(petty.spent.replace(/,/g, '')) / parseInt(petty.limit.replace(/,/g, ''))) * 100;
              return (
                <div key={petty.id} className="nexa-card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-bold text-gray-900">{petty.name}</h4>
                    <span className="text-[10px] text-gray-400">مسئول: {petty.holder}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">مصرف شده:</span>
                      <span className="font-black text-gray-900 font-fa-num">{petty.spent} تومان</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${spentPercent}%` }}
                        className={`h-full ${spentPercent > 80 ? 'bg-rose-500' : 'bg-nexa-accent'}`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400">سقف تنخواه: {petty.limit}</span>
                      <span className={spentPercent > 80 ? 'text-rose-500 font-bold' : 'text-gray-400'}>
                        {Math.round(spentPercent)}٪ مصرف شده
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-nexa-border flex gap-2">
                    <button className="flex-1 py-2 bg-gray-50 text-[10px] font-bold rounded-lg hover:bg-gray-100 transition-colors">ثبت هزینه</button>
                    <button className="flex-1 py-2 bg-nexa-accent/10 text-nexa-accent text-[10px] font-bold rounded-lg hover:bg-nexa-accent/20 transition-colors">شارژ تنخواه</button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        );
      case 'transfers':
        return (
          <motion.div
            key="transfers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto nexa-card p-8"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-nexa-accent/10 text-nexa-accent">
                <ArrowLeftRight size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">انتقال وجه داخلی</h3>
                <p className="text-xs text-gray-500">جابجایی موجودی بین بانک‌ها و صندوق‌ها</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">از حساب / صندوق</label>
                  <select className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm outline-none">
                    <option>بانک ملت</option>
                    <option>بانک سامان</option>
                    <option>صندوق مرکزی</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">به حساب / صندوق</label>
                  <select className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm outline-none">
                    <option>بانک سامان</option>
                    <option>بانک ملت</option>
                    <option>صندوق مرکزی</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500">مبلغ انتقال (تومان)</label>
                <input type="text" placeholder="مثال: ۱۰,۰۰۰,۰۰۰" className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm outline-none font-fa-num" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500">توضیحات</label>
                <textarea rows={3} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm outline-none resize-none" placeholder="دلیل انتقال وجه..."></textarea>
              </div>
              <button className="w-full nexa-btn-primary py-4 text-sm">تایید و اجرای انتقال</button>
            </div>
          </motion.div>
        );
      case 'checks_received':
        return (
          <motion.div
            key="checks_received"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900">چک‌های دریافتی از مشتریان</h3>
              <button className="nexa-btn-primary flex items-center gap-2 text-xs">
                <Plus size={16} />
                ثبت چک جدید
              </button>
            </div>
            <div className="nexa-card overflow-hidden">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-nexa-border">
                    <th className="px-6 py-4">شناسه چک</th>
                    <th className="px-6 py-4">بانک صادرکننده</th>
                    <th className="px-6 py-4">صادرکننده</th>
                    <th className="px-6 py-4">مبلغ (ریال)</th>
                    <th className="px-6 py-4">تاریخ سررسید</th>
                    <th className="px-6 py-4">وضعیت</th>
                    <th className="px-6 py-4">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexa-border">
                  {checksReceived.map((check) => (
                    <tr key={check.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-gray-400 font-fa-num">{check.id}</td>
                      <td className="px-6 py-4 text-xs text-gray-900">بانک {check.bank}</td>
                      <td className="px-6 py-4 text-xs text-gray-600">{check.drawer}</td>
                      <td className="px-6 py-4 text-xs font-black text-emerald-600 font-fa-num">{check.amount}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-fa-num">{check.dueDate}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${
                          check.status === 'وصول شده' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {check.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-gray-400 hover:text-nexa-accent transition-colors">
                          <Stamp size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      case 'checks_paid':
        return (
          <motion.div
            key="checks_paid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900">چک‌های پرداختی به تامین‌کنندگان</h3>
              <button className="nexa-btn-primary flex items-center gap-2 text-xs">
                <Plus size={16} />
                صدور چک جدید
              </button>
            </div>
            <div className="nexa-card overflow-hidden">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-nexa-border">
                    <th className="px-6 py-4">شناسه چک</th>
                    <th className="px-6 py-4">بانک عهده</th>
                    <th className="px-6 py-4">در وجه</th>
                    <th className="px-6 py-4">مبلغ (ریال)</th>
                    <th className="px-6 py-4">تاریخ سررسید</th>
                    <th className="px-6 py-4">وضعیت</th>
                    <th className="px-6 py-4">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexa-border">
                  {checksPaid.map((check) => (
                    <tr key={check.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-gray-400 font-fa-num">{check.id}</td>
                      <td className="px-6 py-4 text-xs text-gray-900">بانک {check.bank}</td>
                      <td className="px-6 py-4 text-xs text-gray-600">{check.payee}</td>
                      <td className="px-6 py-4 text-xs font-black text-rose-600 font-fa-num">{check.amount}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-fa-num">{check.dueDate}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${
                          check.status === 'پاس شده' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {check.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-gray-400 hover:text-nexa-accent transition-colors">
                          <FileCheck2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="nexa-card p-6 bg-emerald-600 text-white">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium opacity-80">موجودی صندوق و بانک</p>
                  <CreditCard size={20} className="opacity-60" />
                </div>
                <p className="text-3xl font-black mt-4 font-fa-num">۲,۴۵۰,۰۰۰,۰۰۰</p>
                <p className="text-xs mt-2 opacity-60">تومان</p>
                <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs opacity-70">رشد نسبت به ماه قبل</span>
                  <span className="text-xs font-bold">+۱۸٪</span>
                </div>
              </div>

              <div className="nexa-card p-6">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-gray-500">مجموع مطالبات (اقساط)</p>
                  <ArrowUpCircle size={20} className="text-emerald-500" />
                </div>
                <p className="text-3xl font-black mt-4 text-gray-900 font-fa-num">۸۴۰,۰۰۰,۰۰۰</p>
                <p className="text-xs mt-2 text-gray-400">تومان</p>
                <div className="mt-6 pt-6 border-t border-nexa-border flex justify-between items-center">
                  <span className="text-xs text-gray-400">سررسید شده در این هفته</span>
                  <span className="text-xs font-bold text-rose-500 font-fa-num">۱۲۵,۰۰۰,۰۰۰</span>
                </div>
              </div>

              <div className="nexa-card p-6">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-gray-500">بدهی به تامین‌کنندگان</p>
                  <ArrowDownCircle size={20} className="text-rose-500" />
                </div>
                <p className="text-3xl font-black mt-4 text-gray-900 font-fa-num">۳۲۰,۰۰۰,۰۰۰</p>
                <p className="text-xs mt-2 text-gray-400">تومان</p>
                <div className="mt-6 pt-6 border-t border-nexa-border flex justify-between items-center">
                  <span className="text-xs text-gray-400">فاکتورهای باز</span>
                  <span className="text-xs font-bold text-amber-500 font-fa-num">۸ عدد</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 nexa-card overflow-hidden">
                <div className="p-6 border-b border-nexa-border flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">آخرین تراکنش‌ها</h3>
                  <div className="relative w-48">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجوی تراکنش..." 
                      className="w-full bg-gray-50 border-none rounded-xl py-1.5 pr-9 pl-3 text-xs" 
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-nexa-border">
                        <th className="px-6 py-4">شناسه</th>
                        <th className="px-6 py-4">نوع / دسته‌بندی</th>
                        <th className="px-6 py-4">مبلغ (تومان)</th>
                        <th className="px-6 py-4">تاریخ</th>
                        <th className="px-6 py-4">وضعیت</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nexa-border">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-gray-400 font-fa-num">{tx.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {tx.type === 'درآمد' ? (
                                <ArrowUpCircle size={14} className="text-emerald-500" />
                              ) : (
                                <ArrowDownCircle size={14} className="text-rose-500" />
                              )}
                              <div>
                                <p className="text-sm font-bold text-gray-900">{tx.category}</p>
                                <p className="text-[10px] text-gray-400">{tx.type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-black font-fa-num ${tx.type === 'درآمد' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.amount}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 font-fa-num">{tx.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              tx.status === 'تایید شده' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-left">
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                              <MoreHorizontal size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                <div className="nexa-card p-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-nexa-accent" />
                    صدور فاکتور هوشمند
                  </h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center cursor-pointer hover:bg-gray-100 transition-colors">
                      <p className="text-xs text-gray-500">برای شروع، مشتری را انتخاب کنید</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button className="py-2.5 text-[10px] font-bold bg-white border border-nexa-border rounded-xl">فاکتور فروش</button>
                        <button className="py-2.5 text-[10px] font-bold bg-white border border-nexa-border rounded-xl">پیش‌فاکتور</button>
                      </div>
                      <button className="w-full py-2.5 text-[10px] font-bold bg-nexa-accent/10 text-nexa-accent border border-nexa-accent/20 rounded-xl flex items-center justify-center gap-2">
                        <Plus size={14} />
                        فاکتور چند سهمی (Multi-Seller)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="nexa-card p-6 border-rose-100 bg-rose-50/30">
                  <div className="flex items-center gap-2 text-rose-600 mb-4">
                    <AlertCircle size={18} />
                    <h4 className="text-sm font-bold">هشدار تسویه سهم فروش</h4>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
                    فاکتورهایی که ۱۰ روز از تحویل نهایی آن‌ها گذشته است، به صورت خودکار در کارتابل پرداخت قرار می‌گیرند.
                  </p>
                  <div className="space-y-3">
                    {[
                      { name: 'آقای کریمی (شعبه مرکزی)', amount: '۱۲,۵۰۰,۰۰۰', deadline: '۲ روز مانده', status: 'در انتظار' },
                      { name: 'خانم نوری (نمایندگی جردن)', amount: '۸,۲۰۰,۰۰۰', deadline: 'امروز', status: 'سررسید شده' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl shadow-sm border border-nexa-border/50">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-gray-800">{item.name}</p>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded ${item.status === 'سررسید شده' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[10px] font-black text-rose-600 font-fa-num">{item.amount} تومان</span>
                          <span className="text-[10px] text-gray-400 font-fa-num">{item.deadline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-[10px] hover:bg-rose-50 transition-colors">
                    مشاهده کارتابل مالی پرداخت
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">امور مالی و فاکتورها</h1>
          <p className="text-gray-500 mt-1">مدیریت جریان نقدی، تنخواه‌گردان و اقساط</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsBalanceSheetModalOpen(true)}
            className="bg-white border border-nexa-border px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            گزارش ترازنامه
          </button>
          <button 
            onClick={() => setIsTransactionModalOpen(true)}
            className="nexa-btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            ثبت تراکنش جدید
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery('');
            }}
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

      {/* Financial Overview */}
      <AnimatePresence mode="wait">
        {renderTabContent()}
      </AnimatePresence>

      {/* Balance Sheet Modal */}
      <AnimatePresence>
        {isBalanceSheetModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBalanceSheetModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-nexa-accent/10 text-nexa-accent rounded-xl">
                    <PieChart size={20} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">گزارش ترازنامه مالی</h3>
                </div>
                <button onClick={() => setIsBalanceSheetModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  {/* Assets */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-emerald-600 flex items-center gap-2">
                      <TrendingUp size={16} />
                      دارایی‌ها (Assets)
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-emerald-50/30 rounded-xl border border-emerald-100">
                        <span className="text-xs text-gray-600">موجودی نقد و بانک</span>
                        <span className="text-sm font-bold text-gray-900 font-fa-num">۲,۴۵۰,۰۰۰,۰۰۰</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-emerald-50/30 rounded-xl border border-emerald-100">
                        <span className="text-xs text-gray-600">حساب‌های دریافتنی</span>
                        <span className="text-sm font-bold text-gray-900 font-fa-num">۸۴۰,۰۰۰,۰۰۰</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-emerald-50/30 rounded-xl border border-emerald-100">
                        <span className="text-xs text-gray-600">موجودی کالا (انبار)</span>
                        <span className="text-sm font-bold text-gray-900 font-fa-num">۱,۱۲۰,۰۰۰,۰۰۰</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-rose-600 flex items-center gap-2">
                      <TrendingDown size={16} />
                      بدهی‌ها (Liabilities)
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-rose-50/30 rounded-xl border border-rose-100">
                        <span className="text-xs text-gray-600">حساب‌های پرداختنی</span>
                        <span className="text-sm font-bold text-gray-900 font-fa-num">۳۲۰,۰۰۰,۰۰۰</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-rose-50/30 rounded-xl border border-rose-100">
                        <span className="text-xs text-gray-600">اسناد پرداختنی (چک)</span>
                        <span className="text-sm font-bold text-gray-900 font-fa-num">۲۹۵,۰۰۰,۰۰۰</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-rose-50/30 rounded-xl border border-rose-100">
                        <span className="text-xs text-gray-600">ذخیره مالیات</span>
                        <span className="text-sm font-bold text-gray-900 font-fa-num">۴۵,۰۰۰,۰۰۰</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-nexa-border flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">سرمایه خالص (Equity)</p>
                    <p className="text-2xl font-black text-nexa-accent font-fa-num">۳,۷۵۰,۰۰۰,۰۰۰ <span className="text-xs font-normal">تومان</span></p>
                  </div>
                  <button className="nexa-btn-primary px-8 py-3 flex items-center gap-2">
                    <Download size={18} />
                    خروجی PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isTransactionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransactionModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">ثبت تراکنش مالی جدید</h3>
                <button onClick={() => setIsTransactionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">نوع تراکنش</label>
                    <select 
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none"
                    >
                      <option value="درآمد">درآمد / واریز</option>
                      <option value="هزینه">هزینه / برداشت</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">تاریخ</label>
                    <input 
                      type="text" 
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none font-fa-num" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">دسته‌بندی / شرح</label>
                  <input 
                    required
                    type="text" 
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                    placeholder="مثال: فروش نهایی فاکتور ۱۲۰"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">مبلغ (تومان)</label>
                  <input 
                    required
                    type="text" 
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    placeholder="مثال: ۵,۰۰۰,۰۰۰"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none font-fa-num" 
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 nexa-btn-primary py-3">ثبت تراکنش</button>
                  <button type="button" onClick={() => setIsTransactionModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">انصراف</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bank Modal */}
      <AnimatePresence>
        {isBankModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBankModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">افزودن حساب بانکی جدید</h3>
                <button onClick={() => setIsBankModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">نام بانک و شعبه</label>
                  <input type="text" placeholder="مثال: بانک ملت - شعبه مرکزی" className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">شماره حساب / کارت</label>
                  <input type="text" placeholder="۵۸۷۴-...." className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm outline-none font-fa-num" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">موجودی اولیه (تومان)</label>
                  <input type="text" placeholder="۰" className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm outline-none font-fa-num" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setIsBankModalOpen(false)} className="flex-1 nexa-btn-primary py-3">ثبت حساب</button>
                  <button onClick={() => setIsBankModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">انصراف</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
