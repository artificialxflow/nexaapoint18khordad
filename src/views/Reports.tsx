import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  PieChart, 
  Calendar, 
  Download, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  FileText,
  CreditCard,
  Factory,
  DollarSign,
  Search,
  ChevronLeft,
  MoreHorizontal,
  X,
  CheckCircle2,
  Clock,
  Calculator
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Pie,
  PieChart as RePieChart,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const salesData = [
  { name: 'فروردین', sales: 4000, profit: 2400 },
  { name: 'اردیبهشت', sales: 3000, profit: 1398 },
  { name: 'خرداد', sales: 2000, profit: 9800 },
  { name: 'تیر', sales: 2780, profit: 3908 },
  { name: 'مرداد', sales: 1890, profit: 4800 },
  { name: 'شهریور', sales: 2390, profit: 3800 },
];

const visitorData = [
  { time: '۰۸:۰۰', count: 5 },
  { time: '۱۰:۰۰', count: 12 },
  { time: '۱۲:۰۰', count: 25 },
  { time: '۱۴:۰۰', count: 18 },
  { time: '۱۶:۰۰', count: 30 },
  { time: '۱۸:۰۰', count: 22 },
  { time: '۲۰:۰۰', count: 10 },
];

const productionData = [
  { name: 'خط ۱', output: 400, efficiency: 85 },
  { name: 'خط ۲', output: 300, efficiency: 92 },
  { name: 'خط ۳', output: 500, efficiency: 78 },
  { name: 'خط ۴', output: 200, efficiency: 95 },
];

const categoryData = [
  { name: 'مبلمان', value: 400, color: '#FFCD11' },
  { name: 'سرویس خواب', value: 300, color: '#10b981' },
  { name: 'اکسسوری', value: 200, color: '#3b82f6' },
  { name: 'ناهارخوری', value: 100, color: '#f43f5e' },
];

const initialInvoices = [
  { id: 'INV-1001', customer: 'شرکت آرمان', amount: '۴۵,۰۰۰,۰۰۰', time: '۰۹:۳۰', status: 'پرداخت شده' },
  { id: 'INV-1002', customer: 'علی محمدی', amount: '۱۲,۸۰۰,۰۰۰', time: '۱۰:۱۵', status: 'در انتظار' },
  { id: 'INV-1003', customer: 'مبلمان نوین', amount: '۸۵,۰۰۰,۰۰۰', time: '۱۱:۴۵', status: 'پرداخت شده' },
  { id: 'INV-1004', customer: 'سارا احمدی', amount: '۳,۵۰۰,۰۰۰', time: '۱۲:۳۰', status: 'لغو شده' },
];

const initialVisitors = [
  { id: 'V-501', name: 'ناشناس', time: '۰۸:۴۵', source: 'اینستاگرام', interest: 'مبلمان راحتی' },
  { id: 'V-502', name: 'رضا علوی', time: '۰۹:۱۵', source: 'گوگل', interest: 'سرویس خواب' },
  { id: 'V-503', name: 'مریم سعیدی', time: '۱۰:۳۰', source: 'مستقیم', interest: 'میز ناهارخوری' },
];

const tabs = [
  { id: 'today', label: 'فاکتورهای امروز' },
  { id: 'visitors', label: 'مراجعین امروز' },
  { id: 'balance', label: 'ترازنامه' },
  { id: 'sales', label: 'گزارش فروش' },
  { id: 'bank', label: 'گزارش بانکی' },
  { id: 'production', label: 'گزارشات تولید' },
  { id: 'financial', label: 'گزارشات مالی' },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '۱۴۰۴/۱۱/۰۱', to: '۱۴۰۴/۱۱/۳۰' });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'today':
        return (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'تعداد فاکتور', value: '۱۲', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'مبلغ کل', value: '۱۴۵,۰۰۰,۰۰۰', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'میانگین فاکتور', value: '۱۲,۰۸۰,۰۰۰', icon: Calculator, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'فاکتورهای باز', value: '۳', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((item, idx) => (
                <div key={idx} className="nexa-card p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                    <item.icon size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold">{item.label}</p>
                    <p className="text-sm font-black text-gray-900 font-fa-num">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="nexa-card overflow-hidden">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-nexa-border">
                    <th className="px-6 py-4">شماره فاکتور</th>
                    <th className="px-6 py-4">مشتری</th>
                    <th className="px-6 py-4">مبلغ (تومان)</th>
                    <th className="px-6 py-4">زمان ثبت</th>
                    <th className="px-6 py-4">وضعیت</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexa-border">
                  {initialInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-gray-400 font-fa-num">{inv.id}</td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-900">{inv.customer}</td>
                      <td className="px-6 py-4 text-xs font-black text-gray-900 font-fa-num">{inv.amount}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-fa-num">{inv.time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${
                          inv.status === 'پرداخت شده' ? 'bg-emerald-50 text-emerald-600' : 
                          inv.status === 'لغو شده' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {inv.status}
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
      case 'visitors':
        return (
          <motion.div
            key="visitors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 nexa-card p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-6">تراکم مراجعین در طول روز</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visitorData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="count" fill="#FFCD11" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="nexa-card p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-6">آخرین مراجعین</h3>
                <div className="space-y-4">
                  {initialVisitors.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-nexa-accent/10 text-nexa-accent flex items-center justify-center">
                          <Users size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{v.name}</p>
                          <p className="text-[10px] text-gray-400">{v.interest}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-fa-num">{v.time}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-2 text-[10px] font-bold text-nexa-accent hover:underline">مشاهده همه مراجعین</button>
              </div>
            </div>
          </motion.div>
        );
      case 'production':
        return (
          <motion.div
            key="production"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="nexa-card p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-6">خروجی خطوط تولید</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Bar dataKey="output" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="nexa-card p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-6">راندمان خطوط</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={productionData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'financial':
        return (
          <motion.div
            key="financial"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="nexa-card p-6 lg:col-span-2">
                <h3 className="text-sm font-bold text-gray-900 mb-6">جریان نقدینگی (Cash Flow)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                      <Tooltip />
                      <Area type="monotone" dataKey="sales" stackId="1" stroke="#FFCD11" fill="#FFCD11" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="profit" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="nexa-card p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-6">توزیع هزینه‌ها</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {categoryData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-500">{item.name}</span>
                      </div>
                      <span className="font-bold text-gray-900 font-fa-num">{item.value}٪</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'balance':
        return (
          <motion.div
            key="balance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="nexa-card p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-6">ساختار دارایی‌ها</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={[
                          { name: 'نقد و بانک', value: 45, color: '#10b981' },
                          { name: 'مطالبات', value: 25, color: '#3b82f6' },
                          { name: 'موجودی کالا', value: 30, color: '#FFCD11' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#FFCD11" />
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="nexa-card p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-6">نسبت‌های مالی کلیدی</h3>
                <div className="space-y-6">
                  {[
                    { label: 'نسبت جاری', value: '۲.۴', desc: 'توانایی پرداخت بدهی‌های کوتاه‌مدت', status: 'عالی' },
                    { label: 'نسبت آنی', value: '۱.۸', desc: 'نقدینگی سریع بدون احتساب کالا', status: 'خوب' },
                    { label: 'نسبت بدهی', value: '۰.۳۵', desc: 'میزان اتکا به منابع خارجی', status: 'ایمن' },
                  ].map((ratio, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-nexa-border/50">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-bold text-gray-900">{ratio.label}</p>
                        <span className="text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded font-bold">{ratio.status}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] text-gray-400">{ratio.desc}</p>
                        <p className="text-lg font-black text-nexa-accent font-fa-num">{ratio.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'bank':
        return (
          <motion.div
            key="bank"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="nexa-card p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-6">توزیع موجودی در بانک‌ها</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'بانک ملت', balance: 1250 },
                    { name: 'بانک سامان', balance: 850 },
                    { name: 'بانک ملی', balance: 450 },
                    { name: 'صندوق مرکزی', balance: 120 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <Tooltip />
                    <Bar dataKey="balance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="nexa-card p-6">
                <h4 className="text-xs font-bold text-gray-400 mb-4">آخرین واریزی‌های بانکی</h4>
                <div className="space-y-3">
                  {[
                    { ref: 'واریز پایا', amount: '۴۵,۰۰۰,۰۰۰', bank: 'ملت', time: '۰۸:۳۰' },
                    { ref: 'فروش کارتخوان', amount: '۱۲,۸۰۰,۰۰۰', bank: 'سامان', time: '۱۰:۱۵' },
                    { ref: 'انتقال داخلی', amount: '۵,۰۰۰,۰۰۰', bank: 'ملی', time: '۱۱:۴۵' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <TrendingUp size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{item.ref}</p>
                          <p className="text-[10px] text-gray-400">بانک {item.bank}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-emerald-600 font-fa-num">{item.amount}</p>
                        <p className="text-[9px] text-gray-400 font-fa-num">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="nexa-card p-6">
                <h4 className="text-xs font-bold text-gray-400 mb-4">آخرین برداشت‌های بانکی</h4>
                <div className="space-y-3">
                  {[
                    { ref: 'پرداخت حقوق', amount: '۸۵,۰۰۰,۰۰۰', bank: 'ملت', time: '۰۹:۰۰' },
                    { ref: 'خرید تنخواه', amount: '۳,۵۰۰,۰۰۰', bank: 'سامان', time: '۱۰:۴۵' },
                    { ref: 'تسویه فاکتور', amount: '۱۲,۰۰۰,۰۰۰', bank: 'ملت', time: '۱۲:۳۰' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                          <TrendingDown size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{item.ref}</p>
                          <p className="text-[10px] text-gray-400">بانک {item.bank}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-rose-600 font-fa-num">{item.amount}</p>
                        <p className="text-[9px] text-gray-400 font-fa-num">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'sales':
        return (
          <motion.div
            key="sales"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 nexa-card p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-8">روند فروش و سود خالص</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFCD11" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#FFCD11" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#FFCD11" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="nexa-card p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp size={18} className="text-nexa-accent" />
                  خلاصه عملکرد ماه
                </h3>
                <div className="space-y-6">
                  {[
                    { label: 'رشد فروش', value: '+۲۴.۵٪', trend: 'up' },
                    { label: 'کاهش هزینه‌ها', value: '-۱۲.۱٪', trend: 'up' },
                    { label: 'نرخ بازگشت مشتری', value: '+۵.۸٪', trend: 'up' },
                    { label: 'زمان تحویل', value: '+۱ روز', trend: 'down' },
                  ].map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
                      <div className={`flex items-center gap-1 text-sm font-black ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stat.value}
                        {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="nexa-card p-6 bg-nexa-accent text-white">
                <h4 className="text-xs font-bold opacity-80 mb-2">تارگت فروش ماهانه</h4>
                <div className="flex justify-between items-end mb-4">
                  <p className="text-2xl font-black font-fa-num">۸۵٪</p>
                  <p className="text-[10px] opacity-60 font-fa-num">۱.۲ از ۱.۵ میلیارد</p>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    className="h-full bg-white"
                  />
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
          <h1 className="text-3xl font-black text-gray-900">گزارشات و تحلیل‌ها</h1>
          <p className="text-gray-500 mt-1">مانیتورینگ هوشمند شاخص‌های کلیدی عملکرد (KPI)</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="bg-white border border-nexa-border px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Filter size={18} />
            فیلتر زمان
          </button>
          <button className="nexa-btn-primary flex items-center gap-2 text-sm">
            <Download size={18} />
            خروجی PDF / Excel
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

      {/* Filter Modal */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">فیلتر گزارشات</h3>
                <button onClick={() => setIsFilterModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">از تاریخ</label>
                    <input 
                      type="text" 
                      value={dateRange.from}
                      onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-fa-num outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">تا تاریخ</label>
                    <input 
                      type="text" 
                      value={dateRange.to}
                      onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-fa-num outline-none" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">واحد سازمانی</label>
                  <select className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm outline-none">
                    <option>همه واحدها</option>
                    <option>فروش</option>
                    <option>تولید</option>
                    <option>مالی</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setIsFilterModalOpen(false)} className="flex-1 nexa-btn-primary py-3">اعمال فیلتر</button>
                  <button onClick={() => setIsFilterModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">انصراف</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
