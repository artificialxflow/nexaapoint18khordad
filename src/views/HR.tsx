import React, { useState } from 'react';
import { 
  UserCircle, 
  Calendar, 
  Wallet, 
  TrendingUp, 
  FileText, 
  Clock,
  Plus,
  ArrowRight,
  Search,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Award,
  Briefcase,
  ShieldCheck,
  MoreVertical,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const initialEmployees = [
  { id: '1', name: 'امیرحسین نکسایی', role: 'مدیر ارشد پروژه', status: 'حاضر', performance: 98, department: 'فنی', joinDate: '۱۴۰۲/۰۵/۱۰' },
  { id: '2', name: 'رضا علوی', role: 'سرپرست تولید', status: 'حاضر', performance: 92, department: 'تولید', joinDate: '۱۴۰۱/۰۸/۱۵' },
  { id: '3', name: 'مریم سعیدی', role: 'طراح داخلی', status: 'مرخصی', performance: 85, department: 'طراحی', joinDate: '۱۴۰۳/۰۱/۲۰' },
  { id: '4', name: 'سعید مرادی', role: 'رویه کوب ارشد', status: 'حاضر', performance: 89, department: 'تولید', joinDate: '۱۴۰۲/۱۱/۰۵' },
];

const initialRequests = [
  { id: '1', title: 'درخواست مرخصی (رضا علوی)', type: 'استحقاقی', status: 'در انتظار', date: '۱۴۰۴/۱۲/۰۱' },
  { id: '2', title: 'درخواست مساعده (سعید مرادی)', type: 'مالی', status: 'تایید شده', date: '۱۴۰۴/۱۱/۲۸' },
  { id: '3', title: 'گزارش خرابی ابزار', type: 'تجهیزات', status: 'در حال بررسی', date: '۱۴۰۴/۱۱/۳۰' },
];

const trainingCourses = [
  { id: '1', title: 'مدیریت زمان و بهره‌وری', instructor: 'دکتر حسینی', duration: '۸ ساعت', progress: 100 },
  { id: '2', title: 'اصول طراحی مدرن مبلمان', instructor: 'مهندس راد', duration: '۱۲ ساعت', progress: 65 },
  { id: '3', title: 'ایمنی و بهداشت در محیط کار', instructor: 'واحد HSE', duration: '۴ ساعت', progress: 30 },
];

const tabs = [
  { id: 'personnel', label: 'مدیریت پرسنل' },
  { id: 'files', label: 'پرونده پرسنلی' },
  { id: 'requests', label: 'درخواست‌ها' },
  { id: 'performance', label: 'گزارش عملکرد' },
  { id: 'training', label: 'آموزش و رشد' },
];

export default function HR() {
  const [activeTab, setActiveTab] = useState('personnel');
  const [employeesList, setEmployeesList] = useState(initialEmployees);
  const [requestsList, setRequestsList] = useState(initialRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', department: '', status: 'حاضر' });
  const [newRequest, setNewRequest] = useState({ title: '', type: 'استحقاقی' });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = {
      id: (employeesList.length + 1).toString(),
      ...newEmployee,
      performance: 100,
      joinDate: '۱۴۰۴/۱۲/۰۱'
    };
    setEmployeesList([emp, ...employeesList]);
    setIsPersonnelModalOpen(false);
    setNewEmployee({ name: '', role: '', department: '', status: 'حاضر' });
  };

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const req = {
      id: (requestsList.length + 1).toString(),
      ...newRequest,
      status: 'در انتظار',
      date: '۱۴۰۴/۱۲/۰۱'
    };
    setRequestsList([req, ...requestsList]);
    setIsRequestModalOpen(false);
    setNewRequest({ title: '', type: 'استحقاقی' });
  };

  const filteredEmployees = employeesList.filter(emp => 
    emp.name.includes(searchQuery) || emp.role.includes(searchQuery) || emp.department.includes(searchQuery)
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personnel':
        return (
          <motion.div 
            key="personnel"
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
                  placeholder="جستجو در نام، نقش یا واحد..." 
                  className="w-full bg-white border border-nexa-border rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                  {employeesList.filter(e => e.status === 'حاضر').length} نفر حاضر
                </span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                  {employeesList.filter(e => e.status === 'مرخصی').length} نفر مرخصی
                </span>
              </div>
            </div>
            <div className="divide-y divide-nexa-border">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-nexa-accent/10 group-hover:text-nexa-accent transition-colors">
                      <UserCircle size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{emp.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-500">{emp.role}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-[10px] text-gray-400">{emp.department}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="hidden md:block text-center">
                      <p className="text-[10px] text-gray-400 mb-1">تاریخ ورود</p>
                      <p className="text-xs font-bold text-gray-700 font-fa-num">{emp.joinDate}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 mb-1">عملکرد</p>
                      <p className="text-xs font-black text-emerald-600 font-fa-num">{emp.performance}٪</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 mb-1">وضعیت</p>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        emp.status === 'حاضر' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {emp.status}
                      </span>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-nexa-accent transition-colors">
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 'requests':
        return (
          <motion.div 
            key="requests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {requestsList.map((req) => (
              <div key={req.id} className="nexa-card p-6 hover:shadow-lg transition-all border-r-4 border-r-nexa-accent">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-sm font-black text-gray-900">{req.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-1">{req.type}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                    req.status === 'تایید شده' ? 'bg-emerald-50 text-emerald-600' : 
                    req.status === 'در انتظار' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-nexa-border">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-fa-num">
                    <Clock size={12} />
                    {req.date}
                  </div>
                  <div className="flex gap-2">
                    <button className="text-[10px] font-bold text-nexa-accent hover:underline">مشاهده جزئیات</button>
                  </div>
                </div>
              </div>
            ))}
            <button 
              onClick={() => setIsRequestModalOpen(true)}
              className="nexa-card p-6 border-dashed border-2 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-nexa-accent hover:border-nexa-accent transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                <Plus size={24} />
              </div>
              <span className="text-xs font-bold">ثبت درخواست جدید</span>
            </button>
          </motion.div>
        );
      case 'training':
        return (
          <motion.div 
            key="training"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trainingCourses.map((course) => (
                <div key={course.id} className="nexa-card p-6">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <GraduationCap size={20} />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 mb-2">{course.title}</h4>
                  <p className="text-[10px] text-gray-500 mb-4">مدرس: {course.instructor}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-400">پیشرفت دوره</span>
                      <span className="text-nexa-accent font-fa-num">{course.progress}٪</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        className="h-full bg-nexa-accent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="nexa-card p-6 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Award size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black">برنامه توسعه فردی (IDP)</h3>
                  <p className="text-xs text-white/70 mt-1">مسیر رشد و ارتقای شغلی خود را مشاهده کنید</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors">
                مشاهده نقشه راه
              </button>
            </div>
          </motion.div>
        );
      case 'performance':
        return (
          <motion.div 
            key="performance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="nexa-card p-8">
                <h3 className="text-lg font-black text-gray-900 mb-6">شاخص‌های کلیدی عملکرد (KPI)</h3>
                <div className="space-y-6">
                  {[
                    { label: 'رضایت شغلی پرسنل', value: 88, color: 'bg-emerald-500' },
                    { label: 'بهره‌وری واحد تولید', value: 92, color: 'bg-blue-500' },
                    { label: 'نرخ ماندگاری نیرو', value: 95, color: 'bg-indigo-500' },
                    { label: 'دقت در اجرای پروژه‌ها', value: 84, color: 'bg-amber-500' },
                  ].map((kpi, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-600">{kpi.label}</span>
                        <span className="font-fa-num">{kpi.value}٪</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${kpi.value}%` }}
                          className={`h-full ${kpi.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="nexa-card p-8 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full border-8 border-emerald-500 border-t-transparent flex items-center justify-center mb-6">
                  <span className="text-2xl font-black text-gray-900 font-fa-num">۹۴٪</span>
                </div>
                <h3 className="text-lg font-black text-gray-900">میانگین عملکرد تیمی</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-xs">عملکرد کلی تیم در ماه جاری نسبت به ماه گذشته ۵٪ رشد داشته است.</p>
                <button className="mt-8 nexa-btn-primary px-8">دریافت گزارش کامل</button>
              </div>
            </div>
          </motion.div>
        );
      case 'files':
        return (
          <motion.div 
            key="files"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="nexa-card p-12 text-center text-gray-400"
          >
            <FileText size={64} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-black text-gray-900">پرونده‌های دیجیتال پرسنل</h3>
            <p className="text-sm mt-2">برای مشاهده پرونده هر فرد، روی نام او در لیست پرسنل کلیک کنید.</p>
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
          <h1 className="text-3xl font-black text-gray-900">منابع انسانی (HR)</h1>
          <p className="text-gray-500 mt-1">مدیریت پرسنل، حضور و غیاب و عملکرد</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsPersonnelModalOpen(true)}
            className="nexa-btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            افزودن پرسنل جدید
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {renderTabContent()}
          </AnimatePresence>
        </div>

        {/* Sidebar Tools */}
        <div className="space-y-6">
          <div className="nexa-card p-6">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-nexa-accent" />
              حضور و غیاب امروز
            </h4>
            <div className="space-y-4">
              {[
                { name: 'امیرحسین نکسایی', time: '۰۸:۰۵', status: 'ورود' },
                { name: 'رضا علوی', time: '۰۸:۱۵', status: 'ورود' },
                { name: 'سعید مرادی', time: '۰۸:۳۰', status: 'ورود' },
              ].map((log, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-bold">{log.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-fa-num text-gray-400">{log.time}</span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2.5 border border-nexa-border rounded-xl text-[10px] font-black text-gray-500 hover:bg-gray-50 transition-colors">
              مشاهده لیست کامل تردد
            </button>
          </div>

          <div className="nexa-card p-6">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-nexa-accent" />
              رشد حقوق و مزایا
            </h4>
            <div className="h-32 flex items-end gap-2 px-2">
              {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="flex-1 bg-nexa-accent/10 rounded-t-md relative group">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className="absolute bottom-0 left-0 right-0 bg-nexa-accent rounded-t-md group-hover:brightness-110 transition-all"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-4">نمودار میانگین دریافتی پرسنل در ۷ ماه اخیر</p>
          </div>

          <div className="nexa-card p-6 bg-amber-50 border-amber-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <h4 className="text-sm font-black text-amber-900">یادآوری مهم</h4>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              بررسی نهایی لیست بیمه اسفند ماه تا پایان امروز الزامی است.
            </p>
          </div>
        </div>
      </div>

      {/* Personnel Modal */}
      <AnimatePresence>
        {isPersonnelModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPersonnelModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">افزودن پرسنل جدید</h3>
                <button onClick={() => setIsPersonnelModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">نام و نام خانوادگی</label>
                  <input 
                    required
                    type="text" 
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                    placeholder="مثال: علی محمدی"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">نقش شغلی</label>
                    <input 
                      required
                      type="text" 
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                      placeholder="مثال: کارشناس فروش"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">واحد سازمانی</label>
                    <input 
                      required
                      type="text" 
                      value={newEmployee.department}
                      onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                      placeholder="مثال: بازرگانی"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none" 
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 nexa-btn-primary py-3">ثبت در سیستم</button>
                  <button type="button" onClick={() => setIsPersonnelModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">انصراف</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">ثبت درخواست جدید</h3>
                <button onClick={() => setIsRequestModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddRequest} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">عنوان درخواست</label>
                  <input 
                    required
                    type="text" 
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                    placeholder="مثال: درخواست مرخصی استحقاقی"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">نوع درخواست</label>
                  <select 
                    value={newRequest.type}
                    onChange={(e) => setNewRequest({...newRequest, type: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 outline-none"
                  >
                    <option value="استحقاقی">مرخصی استحقاقی</option>
                    <option value="استعلاجی">مرخصی استعلاجی</option>
                    <option value="مالی">مساعده مالی</option>
                    <option value="تجهیزات">درخواست تجهیزات</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 nexa-btn-primary py-3">ارسال درخواست</button>
                  <button type="button" onClick={() => setIsRequestModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">انصراف</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

