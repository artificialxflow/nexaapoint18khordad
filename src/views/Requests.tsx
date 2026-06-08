import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  ChevronLeft,
  Package,
  Wrench,
  User,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const requests = [
  { id: 'REQ-1001', title: 'درخواست صندلی اداری نیلپر', type: 'کالا', requester: 'علی محمدی', date: '۱۴۰۴/۱۱/۳۰', status: 'در انتظار تایید', priority: 'high' },
  { id: 'REQ-1002', title: 'تعمیر سیستم سرمایشی زون B', type: 'خدمات', requester: 'سارا رضایی', date: '۱۴۰۴/۱۱/۲۹', status: 'تایید شده', priority: 'medium' },
  { id: 'REQ-1003', title: 'پک لوازم التحریر واحد فروش', type: 'کالا', requester: 'حمید نوری', date: '۱۴۰۴/۱۱/۲۸', status: 'ارسال شده', priority: 'low' },
];

const tabs = [
  { id: 'all', label: 'همه درخواست‌ها', icon: History },
  { id: 'goods', label: 'درخواست کالا', icon: Package },
  { id: 'services', label: 'درخواست خدمات', icon: Wrench },
  { id: 'my_requests', label: 'درخواست‌های من', icon: User },
];

export default function RequestsView() {
  const [requestsList, setRequestsList] = useState(requests);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newRequest, setNewRequest] = useState({ title: '', type: 'کالا', priority: 'medium', description: '' });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const req = {
      id: `REQ-${1000 + requestsList.length + 1}`,
      title: newRequest.title,
      type: newRequest.type,
      requester: 'علی محمدی',
      date: new Date().toLocaleDateString('fa-IR'),
      status: 'در انتظار تایید',
      priority: newRequest.priority
    };
    setRequestsList([req, ...requestsList]);
    setIsModalOpen(false);
    setNewRequest({ title: '', type: 'کالا', priority: 'medium', description: '' });
  };

  const renderTabContent = () => {
    const filteredRequests = requestsList.filter(r => {
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'goods' && r.type === 'کالا') ||
        (activeTab === 'services' && r.type === 'خدمات') ||
        (activeTab === 'my_requests' && r.requester === 'علی محمدی');
      
      const matchesSearch = r.title.includes(searchQuery) || r.id.includes(searchQuery);
      return matchesTab && matchesSearch;
    });

    return (
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="nexa-card overflow-hidden">
          <div className="p-6 border-b border-nexa-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان یا کد درخواست..." 
                className="w-full bg-gray-50 border-none rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-nexa-accent/20"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors">
                <Filter size={16} />
                فیلتر وضعیت
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-gray-50/50 border-b border-nexa-border">
                  <th className="px-6 py-4 text-xs font-black text-gray-400">کد درخواست</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400">عنوان درخواست</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400">نوع</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400">درخواست دهنده</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400">تاریخ</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400">وضعیت</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexa-border">
                <AnimatePresence mode="popLayout">
                  {filteredRequests.map((req) => (
                    <motion.tr 
                      key={req.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm font-black text-gray-900 font-fa-num">{req.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{req.title}</span>
                          <span className={`text-[9px] font-bold ${req.priority === 'high' ? 'text-rose-500' : 'text-gray-400'}`}>
                            اولویت: {req.priority === 'high' ? 'بالا' : req.priority === 'medium' ? 'متوسط' : 'معمولی'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          req.type === 'کالا' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {req.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700 font-bold">{req.requester}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-fa-num">{req.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          req.status === 'تایید شده' ? 'bg-emerald-50 text-emerald-600' : 
                          req.status === 'ارسال شده' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-gray-400 hover:text-nexa-accent transition-colors">
                          <ChevronLeft size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">درخواست کالا و خدمات</h1>
          <p className="text-sm text-gray-500 mt-1">مدیریت درخواست‌های داخلی کالا، ملزومات و خدمات فنی</p>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 md:flex-none bg-white border border-nexa-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <FileText size={18} />
            گزارش درخواست‌ها
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none nexa-btn-primary flex items-center justify-center gap-2 py-3 md:py-2"
          >
            <Plus size={18} />
            ثبت درخواست جدید
          </button>
        </div>
      </div>

      {/* New Request Modal */}
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
                <h3 className="text-lg font-black text-gray-900">ثبت درخواست جدید</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">عنوان درخواست</label>
                  <input 
                    required
                    type="text" 
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20"
                    placeholder="مثلاً: خرید لپ‌تاپ واحد فنی"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">نوع درخواست</label>
                    <select 
                      value={newRequest.type}
                      onChange={(e) => setNewRequest({...newRequest, type: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20"
                    >
                      <option value="کالا">کالا</option>
                      <option value="خدمات">خدمات</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">اولویت</label>
                    <select 
                      value={newRequest.priority}
                      onChange={(e) => setNewRequest({...newRequest, priority: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20"
                    >
                      <option value="low">معمولی</option>
                      <option value="medium">متوسط</option>
                      <option value="high">فوری / بالا</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">توضیحات تکمیلی</label>
                  <textarea 
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 h-24 resize-none"
                    placeholder="جزئیات درخواست خود را اینجا بنویسید..."
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 nexa-btn-primary py-3">ثبت نهایی درخواست</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-colors">انصراف</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'کل درخواست‌ها', value: '۱۵۶', icon: FileText, color: 'text-blue-600' },
          { label: 'در انتظار تایید', value: '۱۲', icon: Clock, color: 'text-amber-600' },
          { label: 'تایید شده / در جریان', value: '۴۵', icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'نیاز به اقدام فوری', value: '۳', icon: AlertCircle, color: 'text-rose-600' },
        ].map((stat, idx) => (
          <div key={idx} className="nexa-card p-6">
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={20} className={stat.color} />
              <span className="text-2xl font-black text-gray-900 font-fa-num">{stat.value}</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {renderTabContent()}
      </AnimatePresence>
    </div>
  );
}
