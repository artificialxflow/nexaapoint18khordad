import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Target, 
  Users, 
  BarChart, 
  Star, 
  MessageSquare,
  ChevronLeft,
  Search,
  Filter,
  X,
  TrendingUp,
  PieChart,
  Award,
  Gift,
  Send,
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const initialCampaigns = [
  { id: '1', name: 'کمپین نوروزی ۱۴۰۴', status: 'active', reach: '۱۲,۰۰۰', conversion: '۴.۵٪', budget: '۵۰,۰۰۰,۰۰۰', type: 'شبکه‌های اجتماعی' },
  { id: '2', name: 'تخفیف ویژه مشتریان VIP', status: 'completed', reach: '۱,۵۰۰', conversion: '۱۲.۲٪', budget: '۱۵,۰۰۰,۰۰۰', type: 'پیامکی' },
  { id: '3', name: 'معرفی کالکشن جدید آوا', status: 'draft', reach: '-', conversion: '-', budget: '۳۰,۰۰۰,۰۰۰', type: 'ایمیل مارکتینگ' },
];

const initialClubMembers = [
  { id: '1', name: 'علی رضایی', tier: 'Gold', points: 2450, lastPurchase: '۱۴۰۴/۱۱/۲۵' },
  { id: '2', name: 'سارا احمدی', tier: 'Silver', points: 1200, lastPurchase: '۱۴۰۴/۱۱/۲۸' },
  { id: '3', name: 'محمد مرادی', tier: 'Platinum', points: 5800, lastPurchase: '۱۴۰۴/۱۲/۰۱' },
  { id: '4', name: 'نرگس سعیدی', tier: 'Bronze', points: 450, lastPurchase: '۱۴۰۴/۱۱/۲۰' },
];

const initialSurveys = [
  { id: '1', title: 'رضایت از کیفیت محصولات', responses: 124, status: 'active', date: '۱۴۰۴/۱۱/۳۰' },
  { id: '2', title: 'نظرسنجی خدمات پس از فروش', responses: 45, status: 'closed', date: '۱۴۰۴/۱۱/۱۵' },
];

const tabs = [
  { id: 'overview', label: 'مرور مارکتینگ' },
  { id: 'campaigns', label: 'کمپین‌ها' },
  { id: 'club', label: 'باشگاه مشتریان' },
  { id: 'surveys', label: 'نظرسنجی' },
  { id: 'results', label: 'گزارش نتایج' },
];

export default function Marketing() {
  const [activeTab, setActiveTab] = useState('overview');
  const [campaignsList, setCampaignsList] = useState(initialCampaigns);
  const [clubMembers, setClubMembers] = useState(initialClubMembers);
  const [surveysList, setSurveysList] = useState(initialSurveys);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'شبکه‌های اجتماعی', budget: '' });
  const [newSurvey, setNewSurvey] = useState({ title: '' });

  const handleAddCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const camp = {
      id: (campaignsList.length + 1).toString(),
      ...newCampaign,
      status: 'draft',
      reach: '-',
      conversion: '-'
    };
    setCampaignsList([camp, ...campaignsList]);
    setIsCampaignModalOpen(false);
    setNewCampaign({ name: '', type: 'شبکه‌های اجتماعی', budget: '' });
  };

  const handleAddSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    const survey = {
      id: (surveysList.length + 1).toString(),
      ...newSurvey,
      responses: 0,
      status: 'active',
      date: '۱۴۰۴/۱۲/۰۱'
    };
    setSurveysList([survey, ...surveysList]);
    setIsSurveyModalOpen(false);
    setNewSurvey({ title: '' });
  };

  const filteredCampaigns = campaignsList.filter(c => c.name.includes(searchQuery));
  const filteredMembers = clubMembers.filter(m => m.name.includes(searchQuery) || m.tier.includes(searchQuery));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'بودجه کل مصرفی', value: '۱۲۵,۰۰۰,۰۰۰', icon: Wallet, color: 'text-blue-600', trend: '+۱۲٪', trendUp: true },
                { label: 'مشتریان فعال', value: '۱,۲۴۰', icon: Users, color: 'text-emerald-600', trend: '+۵٪', trendUp: true },
                { label: 'نرخ تبدیل میانگین', value: '۸.۴٪', icon: Target, color: 'text-amber-600', trend: '-۲٪', trendUp: false },
                { label: 'امتیاز رضایت', value: '۴.۸/۵', icon: Star, color: 'text-rose-600', trend: '+۰.۲', trendUp: true },
              ].map((stat, idx) => (
                <div key={idx} className="nexa-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl bg-gray-50 ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {stat.trend}
                    </div>
                  </div>
                  <p className="text-2xl font-black text-gray-900 font-fa-num">{stat.value}</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="nexa-card p-6">
                <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp size={18} className="text-nexa-accent" />
                  روند بازدید کمپین‌ها
                </h3>
                <div className="h-48 flex items-end gap-3 px-2">
                  {[30, 50, 40, 70, 60, 90, 80, 100, 85, 95, 75, 110].map((h, i) => (
                    <div key={i} className="flex-1 bg-nexa-accent/10 rounded-t-lg relative group">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        className="absolute bottom-0 left-0 right-0 bg-nexa-accent rounded-t-lg group-hover:brightness-110 transition-all"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400">
                  <span>فروردین</span>
                  <span>شهریور</span>
                  <span>اسفند</span>
                </div>
              </div>

              <div className="nexa-card p-6">
                <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
                  <PieChart size={18} className="text-nexa-accent" />
                  توزیع کانال‌های مارکتینگ
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'اینستاگرام', value: 45, color: 'bg-rose-500' },
                    { label: 'تبلیغات کلیکی', value: 25, color: 'bg-blue-500' },
                    { label: 'ایمیل مارکتینگ', value: 15, color: 'bg-amber-500' },
                    { label: 'سایر', value: 15, color: 'bg-gray-400' },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-fa-num">{item.value}٪</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          className={`h-full ${item.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'campaigns':
        return (
          <motion.div 
            key="campaigns"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در کمپین‌ها..." 
                  className="w-full bg-white border border-nexa-border rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none"
                />
              </div>
              <button 
                onClick={() => setIsCampaignModalOpen(true)}
                className="nexa-btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                ایجاد کمپین جدید
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((camp) => (
                <div key={camp.id} className="nexa-card p-6 group hover:border-nexa-accent transition-all relative">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-3 rounded-2xl ${
                      camp.status === 'active' ? 'bg-blue-50 text-blue-600' : 
                      camp.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Megaphone size={24} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        camp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                        camp.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {camp.status === 'active' ? 'در حال اجرا' : camp.status === 'completed' ? 'پایان یافته' : 'پیش‌نویس'}
                      </span>
                      <span className="text-[8px] font-bold text-gray-400">{camp.type}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-black text-gray-900 mb-4">{camp.name}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">میزان بازدید</p>
                      <p className="text-xs font-black text-gray-700 font-fa-num">{camp.reach}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">نرخ تبدیل</p>
                      <p className="text-xs font-black text-emerald-600 font-fa-num">{camp.conversion}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-nexa-border flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-fa-num">
                      <Wallet size={12} />
                      {camp.budget} ریال
                    </div>
                    <button className="p-1.5 text-gray-400 hover:text-nexa-accent transition-colors">
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 'club':
        return (
          <motion.div 
            key="club"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'اعضای طلایی', value: '۱۲۴', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'امتیازات توزیع شده', value: '۴۵,۸۰۰', icon: Gift, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                { label: 'نرخ بازگشت مشتری', value: '۳۲٪', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              ].map((item, idx) => (
                <div key={idx} className="nexa-card p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center`}>
                    <item.icon size={24} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900 font-fa-num">{item.value}</p>
                    <p className="text-xs font-bold text-gray-400">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="nexa-card overflow-hidden">
              <div className="p-6 border-b border-nexa-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                <h3 className="text-sm font-black text-gray-900">لیست اعضای باشگاه</h3>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در اعضا..." 
                    className="w-full bg-white border border-nexa-border rounded-xl py-2 pr-9 pl-4 text-xs focus:ring-2 focus:ring-nexa-accent/20 outline-none"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4">نام مشتری</th>
                      <th className="px-6 py-4">سطح عضویت</th>
                      <th className="px-6 py-4">امتیاز فعلی</th>
                      <th className="px-6 py-4">آخرین خرید</th>
                      <th className="px-6 py-4">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexa-border">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                              <Users size={16} />
                            </div>
                            <span className="text-xs font-bold text-gray-900">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            member.tier === 'Platinum' ? 'bg-indigo-50 text-indigo-600' :
                            member.tier === 'Gold' ? 'bg-amber-50 text-amber-600' :
                            member.tier === 'Silver' ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {member.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-gray-700 font-fa-num">{member.points}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-fa-num">{member.lastPurchase}</td>
                        <td className="px-6 py-4">
                          <button className="p-2 text-gray-400 hover:text-nexa-accent transition-colors">
                            <ArrowUpRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        );
      case 'surveys':
        return (
          <motion.div 
            key="surveys"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900">نظرسنجی‌های فعال و آرشیو شده</h3>
              <button 
                onClick={() => setIsSurveyModalOpen(true)}
                className="nexa-btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                ایجاد نظرسنجی جدید
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {surveysList.map((survey) => (
                <div key={survey.id} className="nexa-card p-6 flex items-center justify-between group hover:border-nexa-accent transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      survey.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900">{survey.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-fa-num">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {survey.responses} پاسخ ثبت شده
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>{survey.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      survey.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {survey.status === 'active' ? 'در حال اجرا' : 'بسته شده'}
                    </span>
                    <button className="p-2 text-gray-400 hover:text-nexa-accent transition-colors">
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 'results':
        return (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="nexa-card p-12 text-center text-gray-400"
          >
            <BarChart size={64} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-black text-gray-900">گزارشات تحلیلی مارکتینگ</h3>
            <p className="text-sm mt-2">در حال آماده‌سازی داده‌های نهایی برای نمایش نمودارهای پیشرفته...</p>
            <button className="mt-8 nexa-btn-primary px-8">دریافت خروجی PDF</button>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">مارکتینگ و تبلیغات</h1>
          <p className="text-gray-500 mt-1">مدیریت کمپین‌ها، باشگاه مشتریان و نظرسنجی‌ها</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCampaignModalOpen(true)}
            className="nexa-btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            ایجاد کمپین جدید
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

      <AnimatePresence mode="wait">
        {renderTabContent()}
      </AnimatePresence>

      {/* Campaign Modal */}
      <AnimatePresence>
        {isCampaignModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCampaignModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">ایجاد کمپین جدید</h3>
                <button onClick={() => setIsCampaignModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddCampaign} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">نام کمپین</label>
                  <input 
                    required
                    type="text" 
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                    placeholder="مثال: جشنواره تابستانه ۱۴۰۴"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">نوع کمپین</label>
                    <select 
                      value={newCampaign.type}
                      onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none"
                    >
                      <option value="شبکه‌های اجتماعی">شبکه‌های اجتماعی</option>
                      <option value="پیامکی">پیامکی</option>
                      <option value="ایمیل مارکتینگ">ایمیل مارکتینگ</option>
                      <option value="تبلیغات محیطی">تبلیغات محیطی</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">بودجه تقریبی (ریال)</label>
                    <input 
                      required
                      type="text" 
                      value={newCampaign.budget}
                      onChange={(e) => setNewCampaign({...newCampaign, budget: e.target.value})}
                      placeholder="مثال: ۵۰,۰۰۰,۰۰۰"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none font-fa-num" 
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 nexa-btn-primary py-3">ثبت کمپین</button>
                  <button type="button" onClick={() => setIsCampaignModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">انصراف</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Survey Modal */}
      <AnimatePresence>
        {isSurveyModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSurveyModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">ایجاد نظرسنجی جدید</h3>
                <button onClick={() => setIsSurveyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddSurvey} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">عنوان نظرسنجی</label>
                  <input 
                    required
                    type="text" 
                    value={newSurvey.title}
                    onChange={(e) => setNewSurvey({...newSurvey, title: e.target.value})}
                    placeholder="مثال: نظرسنجی کیفیت خدمات پس از فروش"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none" 
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 nexa-btn-primary py-3">ایجاد و انتشار</button>
                  <button type="button" onClick={() => setIsSurveyModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">انصراف</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

