import React, { useEffect, useMemo, useState } from 'react';
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
} from 'recharts';
import { motion } from 'motion/react';
import { useBusiness } from '@/src/context/BusinessContext';
import { fetchDashboardSummary } from '@/src/lib/dashboard/client';
import type { DashboardSummary } from '@/src/lib/dashboard/types';

const PRODUCTION_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500'];

const EMPTY_SUMMARY: DashboardSummary = {
  businessName: '',
  stats: {
    receiptTotal: 0,
    paymentTotal: 0,
    peopleCount: 0,
    avgDeliveryDays: null,
  },
  chartData: [],
  productionStatus: [],
};

function formatTodayFa(): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  } catch {
    return '';
  }
}

export default function Dashboard() {
  const { activeBusinessId } = useBusiness();
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [query, setQuery] = useState('');
  const [compact, setCompact] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    if (!activeBusinessId) {
      setSummary(EMPTY_SUMMARY);
      return;
    }
    let cancelled = false;
    void fetchDashboardSummary(activeBusinessId)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(EMPTY_SUMMARY);
      });
    return () => {
      cancelled = true;
    };
  }, [activeBusinessId]);

  const { receiptTotal, paymentTotal, peopleCount, avgDeliveryDays } = summary.stats;
  const deliveryLabel =
    avgDeliveryDays != null ? `${avgDeliveryDays.toLocaleString('fa-IR')} روز` : '—';

  const stats = [
    { label: 'جمع دریافت', value: `${receiptTotal.toLocaleString('fa-IR')}`, change: '+', trend: 'up' as const, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' as const },
    { label: 'جمع پرداخت', value: `${paymentTotal.toLocaleString('fa-IR')}`, change: '-', trend: 'down' as const, icon: ShoppingBag, color: 'text-rose-600', bg: 'bg-rose-50' as const },
    { label: 'تعداد اشخاص', value: `${peopleCount.toLocaleString('fa-IR')}`, change: 'live', trend: 'up' as const, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' as const },
    { label: 'میانگین زمان تحویل', value: deliveryLabel, change: avgDeliveryDays != null ? `${avgDeliveryDays}` : '—', trend: 'down' as const, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' as const },
  ];
  const visibleStats = useMemo(
    () =>
      stats.filter(
        (s) =>
          !hidden.includes(s.label) &&
          (!query.trim() || s.label.includes(query.trim()))
      ),
    [query, hidden, stats]
  );

  const chartData = summary.chartData.length > 0 ? summary.chartData : [{ name: '—', sales: 0, visits: 0 }];
  const productionItems =
    summary.productionStatus.length > 0
      ? summary.productionStatus
      : [{ label: 'بدون بورد', value: 0 }];
  const todayLabel = formatTodayFa();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">داشبورد مدیریتی</h1>
          <p className="text-sm text-gray-500 mt-1">
            {summary.businessName ? `${summary.businessName} · ` : ''}
            {todayLabel ? `امروز ${todayLabel} است.` : 'خوش آمدید.'}
          </p>
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
              <AreaChart data={chartData}>
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
            {productionItems.map((item, idx) => (
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
                    className={`h-full ${PRODUCTION_COLORS[idx % PRODUCTION_COLORS.length]}`}
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
