import React, { useState } from 'react';
import { 
  GitBranch, 
  Plus, 
  Play, 
  Clock, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  X,
  MoreVertical,
  Activity,
  ArrowRight,
  User,
  Package,
  ShoppingCart,
  Headphones,
  Users,
  FileText,
  Zap,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const initialWorkflows = [
  { id: '1', name: 'مدیریت سفارش آنلاین', category: 'orders', status: 'active', lastRun: '۱۰ دقیقه پیش', steps: 5, successRate: '۹۸٪' },
  { id: '2', name: 'تامین موجودی خودکار', category: 'inventory', status: 'active', lastRun: '۱ ساعت پیش', steps: 3, successRate: '۱۰۰٪' },
  { id: '3', name: 'فرآیند مرجوعی کالا', category: 'after-sales', status: 'inactive', lastRun: 'دیروز', steps: 8, successRate: '۸۵٪' },
  { id: '4', name: 'تایید اعتبار نمایندگان', category: 'agents', status: 'active', lastRun: '۲ ساعت پیش', steps: 4, successRate: '۹۲٪' },
  { id: '5', name: 'صدور فاکتور تجمیعی', category: 'auto-reporting', status: 'active', lastRun: '۵ ساعت پیش', steps: 2, successRate: '۹۹٪' },
];

const tabs = [
  { id: 'all', label: 'همه گردشکارها', icon: GitBranch },
  { id: 'orders', label: 'مدیریت سفارش', icon: ShoppingCart },
  { id: 'inventory', label: 'مدیریت موجودی', icon: Package },
  { id: 'after-sales', label: 'خدمات پس از فروش', icon: Headphones },
  { id: 'agents', label: 'مدیریت نمایندگان', icon: Users },
  { id: 'auto-reporting', label: 'گزارش‌گیری خودکار', icon: FileText },
];

type Workflow = (typeof initialWorkflows)[number];

export default function Workflows() {
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [workflowsList, setWorkflowsList] = useState(initialWorkflows);

  const filteredWorkflows = activeTab === 'all' 
    ? workflowsList 
    : workflowsList.filter(w => w.category === activeTab);

  const toggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkflowsList(prev => prev.map(w => 
      w.id === id ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' } : w
    ));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">گردشکارها (Workflows)</h1>
          <p className="text-gray-500 mt-1">مدیریت زنجیره عملیات و فرآیندهای چندمرحله‌ای کسب‌وکار</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="nexa-btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          ایجاد گردشکار جدید
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="nexa-card p-6 border-r-4 border-r-nexa-accent">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-nexa-accent" size={20} />
            <span className="text-xs font-bold text-gray-500">گردشکارهای در جریان</span>
          </div>
          <p className="text-2xl font-black text-gray-900 font-fa-num">۲۴</p>
        </div>
        <div className="nexa-card p-6 border-r-4 border-r-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <span className="text-xs font-bold text-gray-500">نرخ موفقیت کل</span>
          </div>
          <p className="text-2xl font-black text-gray-900 font-fa-num">۹۶.۴٪</p>
        </div>
        <div className="nexa-card p-6 border-r-4 border-r-amber-500">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-amber-500" size={20} />
            <span className="text-xs font-bold text-gray-500">میانگین زمان اجرا</span>
          </div>
          <p className="text-2xl font-black text-gray-900 font-fa-num">۴.۲ <span className="text-xs font-bold">دقیقه</span></p>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredWorkflows.map((wf) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={wf.id} 
              onClick={() => setSelectedWorkflow(wf)}
              className="nexa-card p-6 group cursor-pointer hover:border-nexa-accent transition-all relative overflow-hidden"
            >
              {wf.status === 'active' && (
                <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500" />
              )}
              <div className="flex items-start justify-between mb-6">
                <div className={`p-3 rounded-2xl ${wf.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  <GitBranch size={24} />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => toggleStatus(wf.id, e)}
                    className={`p-2 rounded-lg transition-colors ${wf.status === 'active' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <Play size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-nexa-accent transition-colors">
                    <Settings size={16} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-sm font-bold text-gray-900 mb-4">{wf.name}</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    آخرین اجرا: {wf.lastRun}
                  </span>
                  <span className="text-gray-400 flex items-center gap-1">
                    <GitBranch size={12} />
                    {wf.steps} مرحله
                  </span>
                </div>
                
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: wf.successRate }}
                    className={`h-full ${wf.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-gray-400">نرخ موفقیت</span>
                  <span className={wf.status === 'active' ? 'text-emerald-600' : 'text-gray-500'}>{wf.successRate}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-nexa-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${wf.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className={`text-[10px] font-bold ${
                    wf.status === 'active' ? 'text-emerald-700' : 'text-gray-500'
                  }`}>
                    {wf.status === 'active' ? 'در حال اجرا' : 'متوقف شده'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-nexa-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold">جزئیات</span>
                  <ChevronLeft size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Workflow Detail Modal */}
      <AnimatePresence>
        {selectedWorkflow && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWorkflow(null)}
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
                  <GitBranch className="text-nexa-accent" size={20} />
                  <h3 className="text-lg font-black text-gray-900">{selectedWorkflow.name}</h3>
                </div>
                <button onClick={() => setSelectedWorkflow(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 mb-1">وضعیت فعلی</p>
                      <span className={`text-xs font-black ${selectedWorkflow.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selectedWorkflow.status === 'active' ? 'فعال و در حال اجرا' : 'متوقف شده'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 mb-1">تعداد مراحل</p>
                      <span className="text-xs font-black text-gray-900 font-fa-num">{selectedWorkflow.steps} مرحله عملیاتی</span>
                    </div>
                  </div>
                  <button className="px-6 py-2 bg-nexa-primary text-white rounded-xl text-xs font-bold hover:bg-black transition-colors">
                    ویرایش فرآیند
                  </button>
                </div>

                {/* Visual Steps */}
                <div className="relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2" />
                  <div className="relative flex justify-between">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          step <= 2 ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-gray-200 text-gray-300'
                        }`}>
                          {step < 2 ? <CheckCircle2 size={20} /> : <span className="text-xs font-black font-fa-num">{step}</span>}
                        </div>
                        <span className="text-[9px] font-bold text-gray-500">مرحله {step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-nexa-border/50">
                  <h4 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-nexa-accent" />
                    آخرین فعالیت‌ها
                  </h4>
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-gray-600">اجرای موفقیت‌آمیز مرحله {i}</span>
                        </div>
                        <span className="text-gray-400 font-fa-num">۱۰:۴۵ - امروز</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
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
                <h3 className="text-lg font-black text-gray-900">طراحی گردشکار جدید</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">نام گردشکار</label>
                  <input type="text" placeholder="مثال: فرآیند تایید مرخصی" className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">دسته‌بندی</label>
                  <select className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm outline-none">
                    {tabs.filter(t => t.id !== 'all').map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                  <Zap className="text-amber-500 shrink-0" size={20} />
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    گردشکارها شامل چندین مرحله هستند که می‌توانند به صورت خودکار یا با تایید انسانی پیش بروند. پس از ایجاد، می‌توانید مراحل را در ویرایشگر بصری طراحی کنید.
                  </p>
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 nexa-btn-primary py-3">شروع طراحی</button>
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
