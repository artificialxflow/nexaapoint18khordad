import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  ChevronLeft,
  Truck,
  Package,
  Plus,
  Calendar,
  User,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ordersData = [
  { id: 'ORD-1024', customer: 'خانم احمدی', items: 'مبلمان آوا + نهارخوری', date: '۱۴۰۴/۱۱/۳۰', status: 'در حال تولید', progress: 65, type: 'new' },
  { id: 'ORD-1025', customer: 'آقای رضایی', items: 'سرویس خواب کویین', date: '۱۴۰۴/۱۱/۲۸', status: 'تایید مالی', progress: 20, type: 'new' },
  { id: 'ORD-1026', customer: 'هتل اسپیناس', items: '۲۰ عدد صندلی لابی', date: '۱۴۰۴/۱۱/۲۵', status: 'آماده ارسال', progress: 100, type: 'processing' },
  { id: 'ORD-1027', customer: 'دکتر مرادی', items: 'میز TV و کنسول', date: '۱۴۰۴/۱۱/۲۴', status: 'تحویل شده', progress: 100, type: 'completed' },
];

const tabs = [
  { id: 'all', label: 'همه سفارشات' },
  { id: 'new', label: 'سفارشات جدید' },
  { id: 'processing', label: 'در حال پردازش' },
  { id: 'completed', label: 'تکمیل شده' },
];

export default function Orders() {
  const [ordersList, setOrdersList] = useState(ordersData);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({ customer: '', items: '', date: '', amount: '', status: 'پیش‌فاکتور' });

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const order = {
      id: `ORD-${1024 + ordersList.length + 1}`,
      customer: newOrder.customer,
      items: newOrder.items || 'کالای سفارشی',
      date: new Date().toLocaleDateString('fa-IR'),
      status: newOrder.status,
      progress: newOrder.status === 'تایید شده' ? 10 : 0,
      type: 'new'
    };
    setOrdersList([order, ...ordersList]);
    setIsModalOpen(false);
    setNewOrder({ customer: '', items: '', date: '', amount: '', status: 'پیش‌فاکتور' });
  };

  const filteredOrders = ordersList.filter(order => {
    const matchesTab = activeTab === 'all' || order.type === activeTab;
    const matchesSearch = order.customer.includes(searchQuery) || order.id.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">مدیریت سفارشات</h1>
          <p className="text-sm text-gray-500 mt-1">رهگیری چرخه حیات سفارش از ثبت تا تحویل نهایی</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsShippingModalOpen(true)}
            className="flex-1 md:flex-none bg-white border border-nexa-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Truck size={18} />
            برنامه ارسال
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none nexa-btn-primary flex items-center justify-center gap-2 py-3 md:py-2"
          >
            <ShoppingCart size={18} />
            ثبت سفارش جدید
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'کل سفارشات فعال', value: '۲۴', icon: Package, color: 'text-blue-600' },
          { label: 'در انتظار تایید', value: '۵', icon: AlertCircle, color: 'text-amber-600' },
          { label: 'در حال تولید', value: '۱۲', icon: Clock, color: 'text-indigo-600' },
          { label: 'آماده تحویل', value: '۷', icon: CheckCircle2, color: 'text-emerald-600' },
        ].map((stat, idx) => (
          <div key={idx} className="nexa-card p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black text-gray-900 font-fa-num">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
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
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در شماره سفارش یا نام مشتری..." 
            className="w-full bg-white border border-nexa-border rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-nexa-accent/20"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="nexa-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50/50 border-b border-nexa-border">
                <th className="px-6 py-4 text-xs font-black text-gray-400">شماره سفارش</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400">مشتری</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400">اقلام</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400">وضعیت پیشرفت</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400">وضعیت</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexa-border">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order) => (
                  <motion.tr 
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    layout
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-sm font-black text-gray-900 font-fa-num">{order.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-700">{order.customer}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{order.items}</td>
                    <td className="px-6 py-4">
                      <div className="w-32 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="font-fa-num">{order.progress}٪</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${order.progress}%` }}
                            className={`h-full transition-all duration-500 ${
                              order.progress === 100 ? 'bg-emerald-500' : 'bg-nexa-accent'
                            }`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                        order.status === 'تحویل شده' ? 'bg-emerald-50 text-emerald-600' : 
                        order.status === 'آماده ارسال' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {order.status}
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

      {/* New Order Modal */}
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">ثبت سفارش جدید</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleAddOrder} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                      <User size={14} />
                      انتخاب مشتری
                    </label>
                    <select 
                      required
                      value={newOrder.customer}
                      onChange={(e) => setNewOrder({...newOrder, customer: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20"
                    >
                      <option value="">جستجوی مشتری...</option>
                      <option value="خانم احمدی">خانم احمدی</option>
                      <option value="آقای رضایی">آقای رضایی</option>
                      <option value="مشتری جدید">مشتری جدید</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                      <Calendar size={14} />
                      تاریخ تحویل پیشنهادی
                    </label>
                    <input 
                      type="text" 
                      value={newOrder.date}
                      onChange={(e) => setNewOrder({...newOrder, date: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-fa-num focus:ring-2 focus:ring-nexa-accent/20" 
                      placeholder="۱۴۰۴/۱۲/۱۵" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                    <Package size={14} />
                    اقلام سفارش
                  </label>
                  <input 
                    type="text"
                    value={newOrder.items}
                    onChange={(e) => setNewOrder({...newOrder, items: e.target.value})}
                    placeholder="نام کالا یا مدل..."
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                      <DollarSign size={14} />
                      مبلغ کل (تومان)
                    </label>
                    <input 
                      type="text" 
                      value={newOrder.amount}
                      onChange={(e) => setNewOrder({...newOrder, amount: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-fa-num focus:ring-2 focus:ring-nexa-accent/20" 
                      placeholder="۴۵,۰۰۰,۰۰۰" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">وضعیت اولیه</label>
                    <select 
                      value={newOrder.status}
                      onChange={(e) => setNewOrder({...newOrder, status: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20"
                    >
                      <option value="پیش‌فاکتور">پیش‌فاکتور</option>
                      <option value="تایید شده">تایید شده</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 nexa-btn-primary py-3">ثبت و صدور فاکتور</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">انصراف</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Shipping Schedule Modal */}
      <AnimatePresence>
        {isShippingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShippingModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-nexa-border flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">برنامه‌ریزی ارسال محموله</h3>
                <button onClick={() => setIsShippingModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">انتخاب سفارشات آماده</label>
                  <div className="space-y-2">
                    {ordersList.filter(o => o.progress === 100).map(o => (
                      <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="rounded border-gray-300 text-nexa-accent focus:ring-nexa-accent" />
                          <span className="text-xs font-bold text-gray-900">{o.id} - {o.customer}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">{o.items}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">تاریخ ارسال</label>
                    <input type="text" className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-fa-num focus:ring-2 focus:ring-nexa-accent/20" placeholder="۱۴۰۴/۱۲/۰۵" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">نوع خودرو</label>
                    <select className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20">
                      <option>وانت نیسان</option>
                      <option>خاور مسقف</option>
                      <option>کامیونت</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => setIsShippingModalOpen(false)}
                  className="w-full nexa-btn-primary py-3 mt-4"
                >
                  تایید و ثبت در تقویم ارسال
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
