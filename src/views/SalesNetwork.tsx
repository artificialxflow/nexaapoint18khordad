import React, { useState } from 'react';
import { 
  Network, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  TrendingUp, 
  Users, 
  Award,
  MoreVertical,
  ChevronLeft,
  Globe,
  X,
  DollarSign,
  FileText,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Briefcase,
  Building2,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const initialNetwork = [
  { id: '1', name: 'شعبه مرکزی تهران', manager: 'امیرحسین نکسایی', type: 'agencies', sales: '۸۵۰,۰۰۰,۰۰۰', status: 'فعال', city: 'تهران' },
  { id: '2', name: 'نمایندگی جردن', manager: 'خانم نوری', type: 'agencies', sales: '۴۲۰,۰۰۰,۰۰۰', status: 'فعال', city: 'تهران' },
  { id: '3', name: 'عاملیت اصفهان', manager: 'آقای کریمی', type: 'agents', sales: '۱۸۰,۰۰۰,۰۰۰', status: 'فعال', city: 'اصفهان' },
  { id: '4', name: 'بازاریاب مستقل (شمال)', manager: 'سعید مرادی', type: 'marketers', sales: '۴۵,۰۰۰,۰۰۰', status: 'غیرفعال', city: 'رشت' },
  { id: '5', name: 'کارشناس ارشد فروش', manager: 'مریم سهرابی', type: 'experts', sales: '۳۲۰,۰۰۰,۰۰۰', status: 'فعال', city: 'تهران' },
];

const initialCommissions = [
  { id: '1', member: 'سعید مرادی', amount: '۴,۵۰۰,۰۰۰', date: '۱۴۰۴/۱۱/۳۰', status: 'پرداخت شده' },
  { id: '2', member: 'خانم نوری', amount: '۱۲,۶۰۰,۰۰۰', date: '۱۴۰۴/۱۲/۰۱', status: 'در انتظار' },
];

const tabs = [
  { id: 'agencies', label: 'نمایندگی‌ها' },
  { id: 'agents', label: 'عاملیت‌های فروش' },
  { id: 'experts', label: 'کارشناسان فروش' },
  { id: 'marketers', label: 'بازاریابان بیرونی' },
  { id: 'commissions', label: 'کمیسیون‌ها' },
  { id: 'reports', label: 'گزارشات' },
];

export default function SalesNetwork() {
  const [activeTab, setActiveTab] = useState('agencies');
  const [networkList, setNetworkList] = useState(initialNetwork);
  const [commissionsList, setCommissionsList] = useState(initialCommissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', manager: '', type: 'agencies', city: '' });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const member = {
      id: (networkList.length + 1).toString(),
      ...newMember,
      sales: '۰',
      status: 'فعال'
    };
    setNetworkList([member, ...networkList]);
    setIsAddModalOpen(false);
    setNewMember({ name: '', manager: '', type: 'agencies', city: '' });
  };

  const filteredNetwork = networkList.filter(item => 
    (activeTab === 'reports' || activeTab === 'commissions' || item.type === activeTab) &&
    (item.name.includes(searchQuery) || item.manager.includes(searchQuery))
  );

  const renderTabContent = () => {
    if (activeTab === 'commissions') {
      return (
        <motion.div 
          key="commissions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="nexa-card overflow-hidden"
        >
          <div className="p-6 border-b border-nexa-border bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900">لیست پرداخت‌های کمیسیون</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
              <Clock size={14} />
              آخرین بروزرسانی: امروز
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">نام ذینفع</th>
                  <th className="px-6 py-4">مبلغ (ریال)</th>
                  <th className="px-6 py-4">تاریخ تسویه</th>
                  <th className="px-6 py-4">وضعیت</th>
                  <th className="px-6 py-4">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexa-border">
                {commissionsList.map((comm) => (
                  <tr key={comm.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-900">{comm.member}</td>
                    <td className="px-6 py-4 text-xs font-black text-emerald-600 font-fa-num">{comm.amount}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-fa-num">{comm.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${
                        comm.status === 'پرداخت شده' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {comm.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-gray-400 hover:text-nexa-accent transition-colors">
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      );
    }

    if (activeTab === 'reports') {
      return (
        <motion.div 
          key="reports"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="nexa-card p-6">
            <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 size={18} className="text-nexa-accent" />
              عملکرد ماهانه شبکه فروش
            </h3>
            <div className="h-48 flex items-end gap-3 px-2">
              {[40, 65, 50, 85, 70, 95, 80, 110, 90, 120, 100, 130].map((h, i) => (
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
              <TrendingUp size={18} className="text-nexa-accent" />
              سهم بازار به تفکیک نوع عضو
            </h3>
            <div className="space-y-4">
              {[
                { label: 'نمایندگی‌ها', value: 55, color: 'bg-blue-500' },
                { label: 'عاملیت‌ها', value: 25, color: 'bg-emerald-500' },
                { label: 'بازاریابان', value: 12, color: 'bg-amber-500' },
                { label: 'سایر', value: 8, color: 'bg-gray-400' },
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
        </motion.div>
      );
    }

    return (
      <motion.div 
        key="list"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="nexa-card overflow-hidden"
      >
        <div className="p-6 border-b border-nexa-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام واحد یا مدیر..." 
              className="w-full bg-white border border-nexa-border rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-nexa-border text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">
              <Filter size={16} />
              فیلتر شهر
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">نام واحد / شعبه</th>
                <th className="px-6 py-4">مدیر / مسئول</th>
                <th className="px-6 py-4">شهر</th>
                <th className="px-6 py-4">فروش ماه (ریال)</th>
                <th className="px-6 py-4">وضعیت</th>
                <th className="px-6 py-4">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexa-border">
              {filteredNetwork.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        {item.type === 'agencies' ? <Building2 size={16} /> : <Briefcase size={16} />}
                      </div>
                      <span className="text-xs font-bold text-gray-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">{item.manager}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{item.city}</td>
                  <td className="px-6 py-4 text-xs font-black text-emerald-600 font-fa-num">{item.sales}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${
                      item.status === 'فعال' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-gray-400 hover:text-nexa-accent transition-colors">
                      <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">شبکه فروش و نمایندگان</h1>
          <p className="text-gray-500 mt-1">مدیریت شعب، نمایندگی‌ها، عاملیت‌های فروش و بازاریابان</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsMapOpen(true)}
            className="bg-white border border-nexa-border px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Globe size={18} className="text-blue-600" />
            نقشه پراکندگی
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="nexa-btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            افزودن عضو جدید
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'کل نقاط فروش', value: '۱۲', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'فروش کل شبکه', value: '۱.۵ میلیارد', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'تعداد بازاریابان', value: '۴۵', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'رتبه برتر ماه', value: 'جردن', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, idx) => (
          <div key={idx} className="nexa-card p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 font-fa-num">{stat.value}</p>
              <p className="text-[10px] font-bold text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {renderTabContent()}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">افزودن عضو جدید به شبکه</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">نام واحد / شعبه</label>
                  <input 
                    required
                    type="text" 
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    placeholder="مثال: نمایندگی شمال تهران"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">مدیر / مسئول</label>
                    <input 
                      required
                      type="text" 
                      value={newMember.manager}
                      onChange={(e) => setNewMember({...newMember, manager: e.target.value})}
                      placeholder="نام و نام خانوادگی"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">شهر</label>
                    <input 
                      required
                      type="text" 
                      value={newMember.city}
                      onChange={(e) => setNewMember({...newMember, city: e.target.value})}
                      placeholder="مثال: تهران"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">نوع همکاری</label>
                  <select 
                    value={newMember.type}
                    onChange={(e) => setNewMember({...newMember, type: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none"
                  >
                    <option value="agencies">نمایندگی</option>
                    <option value="agents">عاملیت فروش</option>
                    <option value="experts">کارشناس فروش</option>
                    <option value="marketers">بازاریاب بیرونی</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 nexa-btn-primary py-3">ثبت در شبکه</button>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">انصراف</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Map View Overlay */}
      <AnimatePresence>
        {isMapOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMapOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl h-full bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-nexa-border flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">نقشه پراکندگی شبکه فروش</h3>
                  <p className="text-sm text-gray-500 mt-1">نمایش جغرافیایی نقاط فروش و نمایندگی‌ها در سراسر کشور</p>
                </div>
                <button onClick={() => setIsMapOpen(false)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 bg-gray-50 relative overflow-hidden flex items-center justify-center">
                <Globe size={120} className="text-gray-200 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin size={48} className="text-nexa-accent mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">ماژول نقشه در حال بارگذاری داده‌های جغرافیایی...</p>
                  </div>
                </div>
                
                {/* Simulated Map Pins */}
                <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-nexa-accent rounded-full shadow-lg shadow-nexa-accent/50 animate-bounce" />
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 animate-bounce delay-75" />
                <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50 animate-bounce delay-150" />
              </div>
              <div className="p-8 bg-gray-50 border-t border-nexa-border flex justify-center gap-8">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <div className="w-3 h-3 bg-nexa-accent rounded-full" /> نمایندگی‌ها
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" /> عاملیت‌ها
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" /> بازاریابان
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

