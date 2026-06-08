import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Star, 
  Calendar, 
  Phone, 
  ChevronLeft,
  Users,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const customers = [
  { id: '1', name: 'سارا احمدی', phone: '۰۹۱۲۳۴۵۶۷۸۹', level: 'برلیان', score: 950, lastVisit: '۲ روز پیش', status: 'فعال', source: 'اینستاگرام' },
  { id: '2', name: 'محمد رضایی', phone: '۰۹۱۸۷۶۵۴۳۲۱', level: 'گلد', score: 720, lastVisit: '۱ هفته پیش', status: 'در انتظار', source: 'سایت' },
  { id: '3', name: 'نیلوفر کریمی', phone: '۰۹۳۵۱۱۱۴۴۵۵', level: 'سیلور', score: 450, lastVisit: '۳ هفته پیش', status: 'غیرفعال', source: 'معرفی' },
  { id: '4', name: 'علی حسینی', phone: '۰۹۱۲۹۹۹۸۸۷۷', level: 'برلیان', score: 880, lastVisit: 'امروز', status: 'فعال', source: 'تبلیغات محیطی' },
];

const leads = [
  { id: 'L1', name: 'رضا مرادی', source: 'اینستاگرام', interest: 'مبلمان ال', date: '۱۴۰۴/۱۱/۳۰', status: 'جدید' },
  { id: 'L2', name: 'مریم سعیدی', source: 'سایت', interest: 'سرویس خواب', date: '۱۴۰۴/۱۱/۲۹', status: 'در حال پیگیری' },
  { id: 'L3', name: 'حسین نوری', source: 'معرفی', interest: 'نهارخوری', date: '۱۴۰۴/۱۱/۲۸', status: 'تماس ناموفق' },
];

const visits = [
  { id: 'V1', customer: 'خانم علوی', designer: 'مهندس سمیعی', duration: '۴۵ دقیقه', date: 'امروز ۱۰:۳۰', result: 'مثبت' },
  { id: 'V2', customer: 'آقای تهرانی', designer: '-', duration: '۲۰ دقیقه', date: 'امروز ۰۹:۱۵', result: 'خنثی' },
];

const tabs = [
  { id: 'leads', label: 'سرنخ‌ها', icon: Users },
  { id: 'visits', label: 'بازدید حضوری', icon: Calendar },
  { id: 'opportunities', label: 'فرصت‌ها (کانبان)', icon: Filter },
  { id: 'club', label: 'باشگاه مشتریان', icon: Star },
  { id: 'reports', label: 'گزارشات CRM', icon: PieChart },
];

export default function CRM() {
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [activeTab, setActiveTab] = useState('leads');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'leads':
        return (
          <motion.div 
            key="leads"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="nexa-card overflow-hidden">
              <div className="p-4 border-b border-nexa-border flex items-center justify-between bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900">لیست سرنخ‌های ورودی (Leads)</h3>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-500 hover:bg-white rounded-lg border border-transparent hover:border-nexa-border transition-all">
                    <Search size={18} />
                  </button>
                  <button className="p-2 text-gray-500 hover:bg-white rounded-lg border border-transparent hover:border-nexa-border transition-all">
                    <Filter size={18} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 border-b border-nexa-border">
                      <th className="px-6 py-4">نام سرنخ</th>
                      <th className="px-6 py-4">منبع ورودی</th>
                      <th className="px-6 py-4">علاقمندی</th>
                      <th className="px-6 py-4">تاریخ ثبت</th>
                      <th className="px-6 py-4">وضعیت</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexa-border">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{lead.name}</td>
                        <td className="px-6 py-4 text-gray-500">{lead.source}</td>
                        <td className="px-6 py-4 text-gray-500">{lead.interest}</td>
                        <td className="px-6 py-4 font-fa-num text-gray-400">{lead.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            lead.status === 'جدید' ? 'bg-blue-50 text-blue-600' : 
                            lead.status === 'در حال پیگیری' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <button className="text-nexa-accent font-bold text-xs hover:underline">تبدیل به فرصت</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        );

      case 'visits':
        return (
          <motion.div 
            key="visits"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <a
              href="/dashboard/tasks?tab=reports&section=visits"
              className="text-xs font-bold text-nexa-accent hover:underline inline-block"
            >
              ثبت و مدیریت بازدید در میز کار ←
            </a>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="nexa-card p-6 border-nexa-accent/20 bg-nexa-accent/5">
                <h4 className="text-sm font-bold text-gray-900 mb-4">آمار بازدیدهای امروز</h4>
                <div className="flex items-center justify-around py-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-nexa-accent font-fa-num">۱۲</p>
                    <p className="text-[10px] text-gray-500">کل بازدیدها</p>
                  </div>
                  <div className="w-[1px] h-10 bg-gray-200"></div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-emerald-600 font-fa-num">۴</p>
                    <p className="text-[10px] text-gray-500">منجر به فاکتور</p>
                  </div>
                  <div className="w-[1px] h-10 bg-gray-200"></div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-blue-600 font-fa-num">۳۵</p>
                    <p className="text-[10px] text-gray-500">میانگین زمان (دقیقه)</p>
                  </div>
                </div>
              </div>
              <div className="nexa-card p-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4">ثبت سریع بازدید</h4>
                <div className="flex gap-3">
                  <input type="text" placeholder="نام مشتری یا شماره تماس..." className="flex-1 bg-gray-50 border-none rounded-xl px-4 text-sm" />
                  <button className="nexa-btn-primary py-2 px-6 text-xs">ثبت آنی</button>
                </div>
              </div>
            </div>

            <div className="nexa-card overflow-hidden">
              <div className="p-4 border-b border-nexa-border font-bold text-xs text-gray-500">گزارش بازدیدهای اخیر</div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 border-b border-nexa-border">
                      <th className="px-6 py-4">مشتری</th>
                      <th className="px-6 py-4">دیزاینر همراه</th>
                      <th className="px-6 py-4">مدت زمان</th>
                      <th className="px-6 py-4">تاریخ و ساعت</th>
                      <th className="px-6 py-4">نتیجه اولیه</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexa-border">
                    {visits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{visit.customer}</td>
                        <td className="px-6 py-4 text-gray-500">{visit.designer}</td>
                        <td className="px-6 py-4 text-gray-500 font-fa-num">{visit.duration}</td>
                        <td className="px-6 py-4 font-fa-num text-gray-400">{visit.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            visit.result === 'مثبت' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
                          }`}>
                            {visit.result}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <button className="p-2 hover:bg-gray-100 rounded-lg"><MoreVertical size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        );

      case 'opportunities':
        return (
          <motion.div 
            key="kanban"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {['سرنخ جدید', 'در حال پیگیری', 'پیش فاکتور', 'بستن معامله'].map((column, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-xs font-black text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-nexa-accent"></span>
                    {column}
                  </h4>
                  <span className="text-[10px] font-bold text-gray-400 font-fa-num">۳</span>
                </div>
                <div className="bg-gray-100/50 p-3 rounded-2xl min-h-[400px] space-y-3">
                  {[1, 2].map((card) => (
                    <div key={card} className="bg-white p-4 rounded-xl shadow-sm border border-nexa-border hover:border-nexa-accent transition-all cursor-grab active:cursor-grabbing">
                      <p className="text-xs font-bold text-gray-900 mb-2">پروژه ویلای لواسان</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-gray-400 font-fa-num">۱۴۰۴/۱۱/۳۰</span>
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">س</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        );

      case 'club':
        return (
          <motion.div 
            key="club"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="nexa-card p-8 bg-gradient-to-br from-nexa-primary to-gray-800 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-12">
                      <div>
                        <h3 className="text-2xl font-black">NEXA CLUB</h3>
                        <p className="text-white/40 text-xs mt-1">برنامه وفاداری مشتریان هوشمند</p>
                      </div>
                      <div className="px-4 py-2 bg-nexa-accent text-white rounded-xl text-xs font-black">سطح برلیان</div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">مجموع امتیازات</p>
                        <p className="text-4xl font-black font-fa-num">۱۲,۴۵۰</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-white/40 mb-1">کد عضویت</p>
                        <p className="text-sm font-bold font-fa-num tracking-widest">NX-8842-99</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-nexa-accent/10 rounded-full blur-3xl"></div>
                </div>

                <div className="nexa-card overflow-hidden">
                  <div className="p-6 border-b border-nexa-border font-bold text-sm">مشتریان برتر (Top Tier)</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="text-xs font-bold text-gray-400 border-b border-nexa-border">
                          <th className="px-6 py-4">مشتری</th>
                          <th className="px-6 py-4">امتیاز</th>
                          <th className="px-6 py-4">تعداد خرید</th>
                          <th className="px-6 py-4">آخرین پاداش</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-nexa-border">
                        {customers.filter(c => c.level === 'برلیان').map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold">{c.name}</td>
                            <td className="px-6 py-4 font-fa-num text-nexa-accent font-bold">{c.score}</td>
                            <td className="px-6 py-4 font-fa-num text-gray-500">۱۲</td>
                            <td className="px-6 py-4 text-xs text-emerald-600">تخفیف ۲۰٪ خرید بعدی</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="nexa-card p-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-6">جوایز قابل فعال‌سازی</h4>
                  <div className="space-y-4">
                    {[
                      { title: 'ارسال رایگان سراسری', points: 500, icon: '🚚' },
                      { title: 'کارت هدیه ۵ میلیونی', points: 2500, icon: '🎁' },
                      { title: 'مشاوره دیزاین رایگان', points: 1200, icon: '📐' },
                    ].map((reward, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-nexa-accent/20 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{reward.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{reward.title}</p>
                            <p className="text-[10px] text-gray-500 font-fa-num">{reward.points} امتیاز</p>
                          </div>
                        </div>
                        <ChevronLeft size={16} className="text-gray-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'reports':
        return (
          <motion.div 
            key="reports"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'نرخ تبدیل سرنخ', value: '۲۴٪', trend: '+۵٪', color: 'text-emerald-600' },
                { label: 'میانگین امتیاز وفاداری', value: '۶۸۰', trend: '+۱۲', color: 'text-blue-600' },
                { label: 'بازدیدهای تکراری', value: '۱۸٪', trend: '-۲٪', color: 'text-amber-600' },
                { label: 'رضایت مشتری (CSAT)', value: '۴.۸/۵', trend: '+۰.۱', color: 'text-purple-600' },
              ].map((stat, idx) => (
                <div key={idx} className="nexa-card p-6">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{stat.label}</p>
                  <div className="flex items-end justify-between mt-2">
                    <p className="text-2xl font-black text-gray-900 font-fa-num">{stat.value}</p>
                    <span className={`text-[10px] font-bold ${stat.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="nexa-card p-8">
                <h4 className="text-sm font-bold text-gray-900 mb-8">منابع ورودی مشتریان (Lead Sources)</h4>
                <div className="space-y-6">
                  {[
                    { label: 'اینستاگرام', value: 45, color: 'bg-pink-500' },
                    { label: 'سایت مستقیم', value: 25, color: 'bg-blue-500' },
                    { label: 'تبلیغات محیطی', value: 15, color: 'bg-amber-500' },
                    { label: 'معرفی دوستان', value: 15, color: 'bg-emerald-500' },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-medium text-gray-600">{item.label}</span>
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
              </div>

              <div className="nexa-card p-8 flex flex-col items-center justify-center text-center">
                <div className="w-48 h-48 rounded-full border-[12px] border-gray-50 border-t-nexa-accent flex flex-col items-center justify-center mb-6">
                  <p className="text-4xl font-black text-gray-900 font-fa-num">۷۸٪</p>
                  <p className="text-[10px] text-gray-500">هدف ماهانه</p>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">تحقق اهداف فروش CRM</h4>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                  شما در حال حاضر ۷۸٪ از هدف جذب مشتری وفادار در این ماه را محقق کرده‌اید. فقط ۲۲ مشتری دیگر تا پاداش تیمی فاصله دارید.
                </p>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">مدیریت مشتریان (CRM)</h1>
          <p className="text-sm text-gray-500 mt-1">مدیریت روابط، وفاداری و پیگیری بازدیدها</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowVisitForm(true)}
            className="flex-1 md:flex-none nexa-btn-primary flex items-center justify-center gap-2 py-3 md:py-2"
          >
            <UserPlus size={18} />
            ثبت بازدید جدید
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-white text-nexa-accent shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* CRM Stats - Only show on main list or reports */}
      {(activeTab === 'leads' || activeTab === 'reports') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="nexa-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">کل مشتریان</p>
              <p className="text-xl font-black text-gray-900 font-fa-num">۱,۲۸۴</p>
            </div>
          </div>
          <div className="nexa-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Star size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">مشتریان وفادار (VIP)</p>
              <p className="text-xl font-black text-gray-900 font-fa-num">۱۵۶</p>
            </div>
          </div>
          <div className="nexa-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PieChart size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">نرخ تبدیل بازدید</p>
              <p className="text-xl font-black text-gray-900 font-fa-num">۳۲٪</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {renderTabContent()}
      </AnimatePresence>

      {/* Visit Form Modal (Simplified) */}
      {showVisitForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-nexa-border flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">ثبت بازدید حضوری جدید</h3>
              <button 
                onClick={() => setShowVisitForm(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-1">نام و نام خانوادگی مشتری</label>
                  <input type="text" className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20" placeholder="مثلاً: علی محمدی" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-1">شماره تماس</label>
                  <input type="text" className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 font-fa-num" placeholder="۰۹..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-1">نحوه آشنایی</label>
                  <select className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20">
                    <option>اینستاگرام</option>
                    <option>تبلیغات محیطی</option>
                    <option>معرفی دوستان</option>
                    <option>سایت</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-1">تعداد همراهان</label>
                  <input type="number" className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 font-fa-num" defaultValue={0} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-1">همراهی دیزاینر</label>
                  <select className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20">
                    <option>خیر (بدون دیزاینر)</option>
                    <option>بله (همراه با دیزاینر)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-1">جنسیت مراجع</label>
                  <div className="flex gap-4 p-1 bg-gray-50 rounded-xl">
                    <button className="flex-1 py-2 text-xs font-bold rounded-lg bg-white shadow-sm text-gray-900">خانم</button>
                    <button className="flex-1 py-2 text-xs font-bold rounded-lg text-gray-400 hover:text-gray-600">آقا</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-1">احتمال خرید (۰ تا ۱۰۰٪)</label>
                <input type="range" className="w-full accent-nexa-accent" min="0" max="100" />
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 nexa-btn-primary py-4">ثبت و ذخیره اطلاعات</button>
                <button 
                  onClick={() => setShowVisitForm(false)}
                  className="px-8 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
