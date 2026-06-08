import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight 
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
  Bar
} from 'recharts';
import { motion } from 'motion/react';
import { useCatalog } from '@/src/context/CatalogContext';

const data = [
  { name: 'شنبه', sales: 4000, visits: 2400 },
  { name: 'یکشنبه', sales: 3000, visits: 1398 },
  { name: 'دوشنبه', sales: 2000, visits: 9800 },
  { name: 'سه‌شنبه', sales: 2780, visits: 3908 },
  { name: 'چهارشنبه', sales: 1890, visits: 4800 },
  { name: 'پنجشنبه', sales: 2390, visits: 3800 },
  { name: 'جمعه', sales: 3490, visits: 4300 },
];

export default function Dashboard() {
  const { receipts, payments, people } = useCatalog();
  const [query, setQuery] = useState('');
  const [compact, setCompact] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const receiptTotal = receipts.reduce((acc, doc) => acc + doc.lines.reduce((x, l) => x + l.amount, 0), 0);
  const paymentTotal = payments.reduce((acc, doc) => acc + doc.lines.reduce((x, l) => x + l.amount, 0), 0);
  const stats = [
    { label: 'جمع دریافت', value: `${receiptTotal.toLocaleString('fa-IR')}`, change: '+', trend: 'up', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' as const },
    { label: 'جمع پرداخت', value: `${paymentTotal.toLocaleString('fa-IR')}`, change: '-', trend: 'down', icon: ShoppingBag, color: 'text-rose-600', bg: 'bg-rose-50' as const },
    { label: 'تعداد اشخاص', value: `${people.length.toLocaleString('fa-IR')}`, change: 'live', trend: 'up', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' as const },
    { label: 'میانگین زمان تحویل', value: '۱۸ روز', change: '+۱ روز', trend: 'down', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' as const },
  ];
  const visibleStats = useMemo(
    () =>
      stats.filter(
        (s) =>
          !hidden.includes(s.label) &&
          (!query.trim() || s.label.includes(query.trim()))
      ),
    [query, hidden]
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">داشبورد مدیریتی</h1>
          <p className="text-sm text-gray-500 mt-1">خوش آمدید، امروز پنجشنبه ۳۰ بهمن ۱۴۰۴ است.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 md:flex-none bg-white border border-nexa-border px-4 py-2 rounded-xl text-xs md:text-sm font-medium hover:bg-gray-50 transition-colors">خروجی گزارش</button>
          <button className="flex-1 md:flex-none nexa-btn-primary text-xs md:text-sm">ثبت فاکتور جدید</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="فیلتر ویجت‌های داشبورد"
            className="bg-gray-50 rounded-xl px-3 py-2 text-sm md:w-80"
          />
          <button
            type="button"
            onClick={() => setCompact((x) => !x)}
            className="bg-white border border-nexa-border rounded-xl px-4 py-2 text-xs font-bold"
          >
            {compact ? 'نمایش بزرگ' : 'نمایش فشرده'}
          </button>
        </div>
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${compact ? 'gap-3' : 'gap-6'}`}>
        {visibleStats.map((stat, idx) => (
          <div key={idx} className={`nexa-card flex flex-col justify-between ${compact ? 'p-4' : 'p-6'}`}>
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.change}
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1 font-fa-num">{stat.value}</p>
            </div>
            <button
              type="button"
              onClick={() => setHidden((prev) => [...prev, stat.label])}
              className="text-[11px] mt-3 text-gray-400 hover:text-gray-700"
            >
              مخفی کردن ویجت
            </button>
          </div>
        ))}
      </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 nexa-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900">تحلیل فروش و بازدید</h3>
            <select className="bg-gray-50 border-none rounded-lg text-xs font-medium px-3 py-1.5 focus:ring-0">
              <option>۷ روز اخیر</option>
              <option>۳۰ روز اخیر</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
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
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="nexa-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-8">وضعیت تولید</h3>
          <div className="space-y-6">
            {[
              { label: 'برش CNC', value: 85, color: 'bg-emerald-500' },
              { label: 'اسکلت‌سازی', value: 62, color: 'bg-blue-500' },
              { label: 'رنگ‌کاری', value: 45, color: 'bg-amber-500' },
              { label: 'رویه کوبی', value: 30, color: 'bg-purple-500' },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="font-bold text-gray-900 font-fa-num">{item.value}٪</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-nexa-accent hover:bg-nexa-accent/5 rounded-xl transition-colors">
            مشاهده جزئیات تولید
          </button>
        </div>
      </div>
    </div>
  );
}
