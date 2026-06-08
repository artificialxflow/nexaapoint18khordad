import React, { useState } from 'react';
import { 
  Headset, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search,
  Camera,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const tickets = [
  { id: 'AS-201', customer: 'خانم احمدی', issue: 'لقی پایه صندلی نهارخوری', date: '۱۴۰۴/۱۱/۲۹', status: 'در انتظار تماس', priority: 'high' },
  { id: 'AS-202', customer: 'آقای رضایی', issue: 'تعویض پارچه کوسن', date: '۱۴۰۴/۱۱/۲۸', status: 'در حال تعمیر', priority: 'medium' },
  { id: 'AS-203', customer: 'هتل اسپیناس', product: 'سرویس خواب', issue: 'رگلاژ درب کمد', date: '۱۴۰۴/۱۱/۲۵', status: 'تکمیل شده', priority: 'low' },
];

const tabs = [
  { id: 'warranty', label: 'گارانتی' },
  { id: 'services', label: 'خدمات' },
  { id: 'goods_request', label: 'درخواست کالا' },
  { id: 'delivery', label: 'دلیوری و تحویل' },
];

export default function AfterSales() {
  const [showSLAInfo, setShowSLAInfo] = useState(false);
  const [activeTab, setActiveTab] = useState('warranty');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">خدمات پس از فروش (AS)</h1>
          <p className="text-gray-500 mt-1">مدیریت گارانتی، تیکت‌های تعمیرات و رضایت‌سنجی</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSLAInfo(!showSLAInfo)}
            className="bg-white border border-nexa-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Clock size={18} />
            تحلیل SLA
          </button>
          <button className="nexa-btn-primary text-sm flex items-center gap-2">
            <Plus size={18} />
            ثبت تیکت خدمات جدید
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit overflow-x-auto max-w-full">
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

      {/* SLA Dashboard (Expandable) */}
      <AnimatePresence>
        {showSLAInfo && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="nexa-card p-8 bg-nexa-primary text-white mb-8">
              <h3 className="text-lg font-bold mb-6">داشبورد تحلیل SLA (Service Level Agreement)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between text-xs opacity-60">
                    <span>ثبت تا تماس اولیه</span>
                    <span className="font-fa-num">۱۸ ساعت / هدف: ۲۴ ساعت</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[75%]" />
                  </div>
                  <p className="text-[10px] opacity-40">۹۲٪ تیکت‌ها در بازه طلایی پاسخ داده شده‌اند.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs opacity-60">
                    <span>تماس تا بازدید حضوری</span>
                    <span className="font-fa-num">۳۶ ساعت / هدف: ۴۸ ساعت</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[80%]" />
                  </div>
                  <p className="text-[10px] opacity-40">میانگین زمان اعزام تکنسین بهبود یافته است.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs opacity-60">
                    <span>رفع کامل مشکل</span>
                    <span className="font-fa-num">۵ روز / هدف: ۷ روز</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[70%]" />
                  </div>
                  <p className="text-[10px] opacity-40">بیشترین تاخیر مربوط به تامین قطعات از ترکیه است.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SLA Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="nexa-card p-6">
          <p className="text-xs font-bold text-gray-400 mb-1">زمان ثبت تا تماس</p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-black text-emerald-600 font-fa-num">۱۸ ساعت</p>
            <span className="text-[10px] text-emerald-500 font-bold mb-1">هدف: ۲۴س</span>
          </div>
        </div>
        <div className="nexa-card p-6">
          <p className="text-xs font-bold text-gray-400 mb-1">تیکت‌های باز</p>
          <p className="text-2xl font-black text-gray-900 font-fa-num">۱۲</p>
        </div>
        <div className="nexa-card p-6">
          <p className="text-xs font-bold text-gray-400 mb-1">شاخص رضایت (NPS)</p>
          <p className="text-2xl font-black text-blue-600 font-fa-num">۸.۹ / ۱۰</p>
        </div>
        <div className="nexa-card p-6">
          <p className="text-xs font-bold text-gray-400 mb-1">هزینه گارانتی ماه</p>
          <p className="text-2xl font-black text-rose-600 font-fa-num">۴,۲۰۰,۰۰۰</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List */}
        <div className="lg:col-span-2 nexa-card overflow-hidden">
          <div className="p-6 border-b border-nexa-border flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">تیکت‌های فعال</h3>
            <div className="relative w-48">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" placeholder="جستجوی تیکت..." className="w-full bg-gray-50 border-none rounded-xl py-1.5 pr-9 pl-3 text-xs" />
            </div>
          </div>
          <div className="divide-y divide-nexa-border">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-6 hover:bg-gray-50/50 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      ticket.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Headset size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-gray-400 font-fa-num">{ticket.id}</span>
                        <h4 className="text-sm font-bold text-gray-900">{ticket.customer}</h4>
                      </div>
                      <p className="text-xs text-gray-600">{ticket.issue}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      ticket.status === 'تکمیل شده' ? 'bg-emerald-50 text-emerald-600' : 
                      ticket.status === 'در حال تعمیر' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {ticket.status}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-2 font-fa-num">{ticket.date}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-nexa-border rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50">
                    <MessageCircle size={14} />
                    ارسال پیام به مشتری
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-nexa-border rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50">
                    <Camera size={14} />
                    مشاهده تصاویر
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AS Tools */}
        <div className="space-y-6">
          <div className="nexa-card p-6 bg-nexa-primary text-white">
            <h4 className="text-sm font-bold mb-4">برآورد هزینه تعمیرات</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] opacity-60">قطعات تعویضی</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs" placeholder="مثلاً: لولا، پایه..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] opacity-60">اجرت تعمیر</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs font-fa-num" placeholder="مبلغ به تومان" />
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-xs font-bold mb-4">
                  <span>جمع کل:</span>
                  <span className="font-fa-num text-nexa-accent">۰ تومان</span>
                </div>
                <button className="w-full py-3 bg-nexa-accent text-white rounded-xl font-bold text-xs">صدور فاکتور خدمات</button>
              </div>
            </div>
          </div>

          <div className="nexa-card p-6">
            <h4 className="text-sm font-bold text-gray-900 mb-4">وضعیت گارانتی محصولات</h4>
            <div className="relative">
              <input type="text" placeholder="اسکن بارکد یا شماره سریال..." className="w-full bg-gray-50 border border-nexa-border rounded-xl py-3 px-4 text-xs font-fa-num" />
              <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
              با وارد کردن شماره سریال، تاریخ انقضای گارانتی و سوابق تعمیراتی محصول نمایش داده می‌شود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
