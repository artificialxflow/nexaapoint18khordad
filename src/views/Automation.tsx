import React, { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Play, 
  Settings, 
  Bell, 
  Mail, 
  MessageSquare, 
  Database,
  ChevronLeft,
  MoreVertical,
  Activity,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  DollarSign,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const initialWorkflows = [
  { id: '1', name: 'اطلاع‌رسانی خودکار فاکتور', trigger: 'ثبت فاکتور جدید', action: 'ارسال پیامک به مشتری', status: 'فعال', lastRun: '۱۰ دقیقه پیش' },
  { id: '2', name: 'ایجاد دستور تولید خودکار', trigger: 'تایید مالی فاکتور', action: 'ایجاد تسک در واحد تولید', status: 'فعال', lastRun: '۲ ساعت پیش' },
  { id: '3', name: 'یادآوری پیگیری سرنخ', trigger: '۴۸ ساعت عدم فعالیت', action: 'اعلان به کارشناس فروش', status: 'فعال', lastRun: '۱ روز پیش' },
  { id: '4', name: 'تبریک تولد مشتریان', trigger: 'تاریخ تولد', action: 'ارسال کوپن تخفیف', status: 'غیرفعال', lastRun: '۳ روز پیش' },
];

const logs = [
  { id: 'L1', flow: 'اطلاع‌رسانی فاکتور', status: 'success', time: '۱۰:۴۵', desc: 'پیامک به شماره ۰۹۱۲... ارسال شد.' },
  { id: 'L2', flow: 'دستور تولید', status: 'success', time: '۰۹:۳۰', desc: 'تسک #۴۵۲ در واحد تولید ایجاد شد.' },
  { id: 'L3', flow: 'یادآوری سرنخ', status: 'error', time: '۰۸:۱۵', desc: 'خطا در اتصال به پنل پیامک.' },
];

const tabs = [
  { id: 'workflows', label: 'گردش‌کارهای هوشمند', icon: Zap },
  { id: 'logs', label: 'لاگ‌های سیستم', icon: Activity },
  { id: 'triggers', label: 'محرک‌ها (Triggers)', icon: Play },
  { id: 'actions', label: 'عملیات‌ها (Actions)', icon: Settings },
];

export default function Automation() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workflowsList, setWorkflowsList] = useState(initialWorkflows);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleStatus = (id: string) => {
    setWorkflowsList(prev => prev.map(flow => 
      flow.id === id ? { ...flow, status: flow.status === 'فعال' ? 'غیرفعال' : 'فعال' } : flow
    ));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'logs':
        return (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="nexa-card overflow-hidden"
          >
            <div className="p-4 border-b border-nexa-border bg-gray-50/50 flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-500">تاریخچه اجرای عملیات‌ها</h4>
              <button className="text-[10px] text-nexa-accent flex items-center gap-1 hover:underline">
                <RefreshCw size={12} />
                به‌روزرسانی
              </button>
            </div>
            <div className="divide-y divide-nexa-border">
              {logs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {log.status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{log.flow}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{log.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-fa-num">{log.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 'triggers':
        return (
          <motion.div
            key="triggers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {[
              { title: 'رویدادهای فروش', desc: 'ثبت فاکتور، تایید مالی، لغو سفارش', icon: DollarSign },
              { title: 'رویدادهای انبار', desc: 'خروج کالا، رسید انبار، حداقل موجودی', icon: Database },
              { title: 'رویدادهای مشتری', desc: 'ثبت‌نام جدید، تاریخ تولد، عدم فعالیت', icon: Users },
              { title: 'رویدادهای زمانی', desc: 'ساعت مشخص، بازه‌های دوره‌ای', icon: Clock },
            ].map((t, idx) => (
              <div key={idx} className="nexa-card p-6 flex items-start gap-4 hover:border-nexa-accent transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-nexa-accent/10 group-hover:text-nexa-accent flex items-center justify-center transition-colors">
                  {t.icon ? <t.icon size={24} /> : <Play size={24} />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{t.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="workflows"
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
                  placeholder="جستجو در گردش‌کارها..." 
                  className="w-full bg-white border border-nexa-border rounded-xl py-2 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-nexa-accent/20" 
                />
              </div>
              <button className="p-2 text-gray-500 hover:bg-white rounded-lg border border-transparent hover:border-nexa-border transition-all">
                <Filter size={18} />
              </button>
            </div>

            <div className="divide-y divide-nexa-border">
              {workflowsList.filter(f => f.name.includes(searchQuery)).map((flow) => (
                <div key={flow.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      flow.status === 'فعال' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Zap size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">{flow.name}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Play size={12} />
                          محرک: {flow.trigger}
                        </span>
                        <span className="flex items-center gap-1">
                          <Settings size={12} />
                          عملیات: {flow.action}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          آخرین اجرا: {flow.lastRun}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${flow.status === 'فعال' ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {flow.status}
                      </span>
                      <button 
                        onClick={() => toggleStatus(flow.id)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${flow.status === 'فعال' ? 'bg-emerald-500' : 'bg-gray-200'}`}
                      >
                        <motion.div 
                          animate={{ x: flow.status === 'فعال' ? -20 : 0 }}
                          className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full transition-all" 
                        />
                      </button>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-nexa-accent transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">اتومیشن و گردش‌کارها</h1>
          <p className="text-gray-500 mt-1">خودکارسازی فرآیندهای بیزینسی، اطلاع‌رسانی‌ها و وظایف تکراری</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="nexa-btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          ایجاد گردش‌کار جدید
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="nexa-card p-6 bg-indigo-50 border-indigo-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Activity size={20} />
            </div>
            <h4 className="text-sm font-bold text-indigo-900">گردش‌کارهای فعال</h4>
          </div>
          <p className="text-3xl font-black text-indigo-700 font-fa-num">۱۲</p>
          <p className="text-[10px] text-indigo-600/60 mt-2">صرفه‌جویی در ۴۵ ساعت کاری در هفته</p>
        </div>
        <div className="nexa-card p-6 bg-emerald-50 border-emerald-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h4 className="text-sm font-bold text-emerald-900">عملیات‌های موفق</h4>
          </div>
          <p className="text-3xl font-black text-emerald-700 font-fa-num">۱,۴۲۰</p>
          <p className="text-[10px] text-emerald-600/60 mt-2">در ۷ روز گذشته</p>
        </div>
        <div className="nexa-card p-6 bg-amber-50 border-amber-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
              <Bell size={20} />
            </div>
            <h4 className="text-sm font-bold text-amber-900">اطلاع‌رسانی‌های خودکار</h4>
          </div>
          <p className="text-3xl font-black text-amber-700 font-fa-num">۸۵۰</p>
          <p className="text-[10px] text-amber-600/60 mt-2">پیامک و ایمیل ارسال شده</p>
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

      <AnimatePresence mode="wait">
        {renderTabContent()}
      </AnimatePresence>

      {/* Create Workflow Modal */}
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
                <h3 className="text-lg font-black text-gray-900">ایجاد گردش‌کار هوشمند</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">نام گردش‌کار</label>
                  <input type="text" placeholder="مثال: تایید خودکار فاکتور" className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm outline-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">انتخاب محرک (Trigger)</label>
                    <select className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm outline-none">
                      <option>ثبت فاکتور جدید</option>
                      <option>تغییر وضعیت تسک</option>
                      <option>ورود مشتری جدید</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">انتخاب عملیات (Action)</label>
                    <select className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm outline-none">
                      <option>ارسال پیامک</option>
                      <option>ایجاد تسک</option>
                      <option>تغییر وضعیت مالی</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                  <AlertCircle className="text-blue-500 shrink-0" size={20} />
                  <p className="text-[10px] text-blue-700 leading-relaxed">
                    پس از ذخیره، این گردش‌کار به صورت خودکار فعال شده و در صورت وقوع محرک، عملیات مربوطه را اجرا خواهد کرد.
                  </p>
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 nexa-btn-primary py-3">ذخیره و فعال‌سازی</button>
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">انصراف</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
