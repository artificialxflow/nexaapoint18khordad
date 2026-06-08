import React, { useState } from 'react';
import { 
  Store, 
  Plus, 
  Search, 
  Filter, 
  Package, 
  TrendingUp, 
  Settings, 
  Globe, 
  ChevronLeft,
  Image as ImageIcon,
  Tag,
  BarChart3,
  ShoppingCart,
  X,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const initialProducts = [
  { id: '1', name: 'مبلمان آوا', cat: 'مبلمان', price: '۴۵,۰۰۰,۰۰۰', stock: '۱۲', seo: 'عالی', status: 'active' },
  { id: '2', name: 'سرویس خواب کویین', cat: 'سرویس خواب', price: '۳۲,۰۰۰,۰۰۰', stock: '۵', seo: 'خوب', status: 'active' },
  { id: '3', name: 'میز نهارخوری لوکس', cat: 'نهارخوری', price: '۱۸,۵۰۰,۰۰۰', stock: '۸', seo: 'نیاز به بهبود', status: 'active' },
];

const initialOrders = [
  { id: 'ORD-501', customer: 'علیرضا محمدی', date: '۱۴۰۲/۱۱/۲۵', total: '۴۵,۰۰۰,۰۰۰', status: 'pending' },
  { id: 'ORD-502', customer: 'سارا احمدی', date: '۱۴۰۲/۱۱/۲۴', total: '۱۲,۸۰۰,۰۰۰', status: 'shipped' },
  { id: 'ORD-503', customer: 'رضا کریمی', date: '۱۴۰۲/۱۱/۲۳', total: '۸,۵۰۰,۰۰۰', status: 'delivered' },
];

const tabs = [
  { id: 'products', label: 'مدیریت محصولات' },
  { id: 'orders', label: 'سفارشات فروشگاه' },
  { id: 'seo', label: 'تنظیمات SEO' },
  { id: 'settings', label: 'تنظیمات فروشگاه' },
  { id: 'analytics', label: 'تحلیل فروش' },
];

export default function StoreAdmin() {
  const [activeTab, setActiveTab] = useState('products');
  const [productsList, setProductsList] = useState(initialProducts);
  const [ordersList, setOrdersList] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', cat: 'مبلمان', price: '', stock: '' });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const product = {
      id: (productsList.length + 1).toString(),
      ...newProduct,
      seo: 'نیاز به بررسی',
      status: 'active'
    };
    setProductsList([product, ...productsList]);
    setIsModalOpen(false);
    setNewProduct({ name: '', cat: 'مبلمان', price: '', stock: '' });
  };

  const filteredProducts = productsList.filter(p => 
    p.name.includes(searchQuery) || p.cat.includes(searchQuery)
  );

  const filteredOrders = ordersList.filter(o => 
    o.customer.includes(searchQuery) || o.id.includes(searchQuery)
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <motion.div 
            key="products"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'کل محصولات', value: productsList.length.toString(), icon: Package, color: 'text-blue-600' },
                { label: 'سفارشات امروز', value: '۱۲', icon: ShoppingCart, color: 'text-emerald-600' },
                { label: 'بازدید ماهانه', value: '۴۵.۲K', icon: Globe, color: 'text-purple-600' },
                { label: 'نرخ تبدیل', value: '۳.۸٪', icon: TrendingUp, color: 'text-amber-600' },
              ].map((stat, idx) => (
                <div key={idx} className="nexa-card p-6">
                  <p className="text-xs font-bold text-gray-400 mb-1">{stat.label}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-black text-gray-900 font-fa-num">{stat.value}</p>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                </div>
              ))}
            </div>

            <div className="nexa-card overflow-hidden">
              <div className="p-6 border-b border-nexa-border flex items-center justify-between bg-gray-50/50">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی محصول..." 
                    className="w-full bg-white border border-nexa-border rounded-xl py-2 pr-10 pl-4 text-sm" 
                  />
                </div>
                <button className="p-2 text-gray-500 hover:bg-white rounded-lg border border-transparent hover:border-nexa-border transition-all">
                  <Filter size={18} />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-nexa-border">
                      <th className="px-6 py-4">محصول</th>
                      <th className="px-6 py-4">دسته‌بندی</th>
                      <th className="px-6 py-4">قیمت</th>
                      <th className="px-6 py-4">موجودی</th>
                      <th className="px-6 py-4">وضعیت سئو</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexa-border">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                              <ImageIcon size={20} />
                            </div>
                            <span className="text-sm font-bold text-gray-900">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{p.cat}</td>
                        <td className="px-6 py-4 text-sm font-black text-gray-900 font-fa-num">{p.price}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-fa-num">{p.stock}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            p.seo === 'عالی' ? 'bg-emerald-50 text-emerald-600' : 
                            p.seo === 'خوب' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {p.seo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <button className="p-1.5 text-gray-400 hover:text-nexa-accent transition-all">
                            <ChevronLeft size={18} />
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
      case 'orders':
        return (
          <motion.div 
            key="orders"
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
                  placeholder="جستجوی سفارش یا مشتری..." 
                  className="w-full bg-white border border-nexa-border rounded-xl py-2 pr-10 pl-4 text-sm" 
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-nexa-border">
                    <th className="px-6 py-4">شماره سفارش</th>
                    <th className="px-6 py-4">مشتری</th>
                    <th className="px-6 py-4">تاریخ</th>
                    <th className="px-6 py-4">مبلغ کل</th>
                    <th className="px-6 py-4">وضعیت</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexa-border">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-black text-gray-900 font-fa-num">{order.id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-700">{order.customer}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-fa-num">{order.date}</td>
                      <td className="px-6 py-4 text-sm font-black text-gray-900 font-fa-num">{order.total}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 
                          order.status === 'shipped' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {order.status === 'delivered' ? 'تحویل شده' : order.status === 'shipped' ? 'ارسال شده' : 'در انتظار'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <button className="p-2 text-gray-400 hover:text-nexa-accent transition-colors">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      case 'seo':
        return (
          <motion.div 
            key="seo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="nexa-card p-8">
                <h3 className="text-lg font-black mb-6">تنظیمات سئو عمومی محصولات</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">ساختار URL محصولات</label>
                    <div className="flex gap-2">
                      <span className="bg-gray-100 px-3 py-2 rounded-lg text-xs text-gray-400 flex items-center">nexa.ir/shop/</span>
                      <input type="text" defaultValue="{product-name}" className="flex-1 bg-white border border-nexa-border rounded-xl py-2 px-4 text-sm font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">توضیحات متا پیش‌فرض (Meta Description)</label>
                    <textarea 
                      className="w-full bg-white border border-nexa-border rounded-xl py-3 px-4 text-sm min-h-[100px]"
                      placeholder="توضیحاتی که در نتایج گوگل نمایش داده می‌شود..."
                    ></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700">تولید خودکار کلمات کلیدی</label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-nexa-border">
                        <input type="checkbox" className="w-4 h-4 accent-nexa-accent" defaultChecked />
                        <span className="text-xs text-gray-600">فعال‌سازی هوش مصنوعی سئو</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700">ایندکس خودکار در گوگل</label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-nexa-border">
                        <input type="checkbox" className="w-4 h-4 accent-nexa-accent" defaultChecked />
                        <span className="text-xs text-gray-600">ارسال خودکار به Search Console</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-nexa-border flex justify-end">
                  <button className="nexa-btn-primary">ذخیره تنظیمات سئو</button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="nexa-card p-6 bg-blue-600 text-white">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={18} />
                  وضعیت سئو فروشگاه
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs opacity-70">امتیاز کلی سئو</span>
                    <span className="text-lg font-black font-fa-num">۸۸/۱۰۰</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[88%]"></div>
                  </div>
                  <p className="text-[10px] opacity-60 leading-relaxed">
                    محصولات شما در کلمات کلیدی &quot;مبلمان مدرن&quot; و &quot;سرویس خواب لوکس&quot; در صفحه اول گوگل قرار دارند.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'analytics':
        return (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="nexa-card p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <TrendingUp size={20} />
                  </div>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                    <ArrowUpRight size={10} />
                    ۱۲٪ رشد
                  </span>
                </div>
                <p className="text-xs opacity-70 mb-1">فروش کل ماه</p>
                <h4 className="text-2xl font-black font-fa-num">۴۵۰,۰۰۰,۰۰۰</h4>
              </div>
              <div className="nexa-card p-6 bg-white border border-nexa-border">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ShoppingCart size={20} />
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full flex items-center gap-1">
                    <ArrowUpRight size={10} />
                    ۸٪ رشد
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-1">تعداد سفارشات</p>
                <h4 className="text-2xl font-black text-gray-900 font-fa-num">۱۸۴</h4>
              </div>
              <div className="nexa-card p-6 bg-white border border-nexa-border">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Eye size={20} />
                  </div>
                  <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded-full flex items-center gap-1">
                    <ArrowDownRight size={10} />
                    ۳٪ کاهش
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-1">بازدید کنندگان</p>
                <h4 className="text-2xl font-black text-gray-900 font-fa-num">۱۲,۴۵۰</h4>
              </div>
            </div>

            <div className="nexa-card p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-gray-900">نمودار فروش ۷ روز اخیر</h3>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    فروش نقدی
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                    فروش اقساطی
                  </span>
                </div>
              </div>
              <div className="h-64 flex items-end gap-4">
                {[45, 60, 35, 80, 55, 90, 75].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full relative flex flex-col justify-end h-full">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${val}%` }}
                        className="w-full bg-indigo-500 rounded-t-lg group-hover:bg-indigo-600 transition-colors"
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-fa-num">
                        {val} میلیون
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-fa-num">روز {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 'settings':
        return (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="nexa-card p-8"
          >
            <h3 className="text-lg font-black mb-8">تنظیمات فروشگاه آنلاین</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">نام فروشگاه</label>
                  <input type="text" defaultValue="نکسا مارکت" className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">ایمیل پشتیبانی</label>
                  <input type="email" defaultValue="support@nexa.ir" className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">واحد پول</label>
                  <select className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20">
                    <option>تومان</option>
                    <option>ریال</option>
                  </select>
                </div>
              </div>
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-3xl space-y-4">
                  <h4 className="text-sm font-bold text-gray-900">وضعیت درگاه‌های پرداخت</h4>
                  <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-nexa-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <CreditCard size={18} />
                      </div>
                      <span className="text-xs font-bold">درگاه زرین‌پال</span>
                    </div>
                    <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-nexa-border opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                        <CreditCard size={18} />
                      </div>
                      <span className="text-xs font-bold">درگاه بانک ملت</span>
                    </div>
                    <div className="w-10 h-5 bg-gray-300 rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-nexa-border flex justify-end gap-3">
              <button className="px-6 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">انصراف</button>
              <button className="nexa-btn-primary">ذخیره تغییرات</button>
            </div>
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
          <h1 className="text-3xl font-black text-gray-900">مدیریت فروشگاه آنلاین</h1>
          <p className="text-gray-500 mt-1">کنترل کامل بر محصولات، سفارشات و سئو مارکت‌پلیس</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-nexa-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Globe size={18} />
            مشاهده فروشگاه
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="nexa-btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            افزودن محصول جدید
          </button>
        </div>
      </div>

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

      <AnimatePresence mode="wait">
        {renderTabContent()}
      </AnimatePresence>

      {/* New Product Modal */}
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
                <h3 className="text-lg font-black text-gray-900">افزودن محصول جدید به فروشگاه</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">نام محصول</label>
                  <input 
                    required
                    type="text" 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">دسته‌بندی</label>
                    <select 
                      value={newProduct.cat}
                      onChange={(e) => setNewProduct({...newProduct, cat: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20"
                    >
                      <option>مبلمان</option>
                      <option>سرویس خواب</option>
                      <option>نهارخوری</option>
                      <option>اکسسوری</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">قیمت (تومان)</label>
                    <input 
                      required
                      type="text" 
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-fa-num focus:ring-2 focus:ring-nexa-accent/20" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">موجودی انبار</label>
                  <input 
                    required
                    type="number" 
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-fa-num focus:ring-2 focus:ring-nexa-accent/20" 
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 nexa-btn-primary py-3">انتشار محصول</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">انصراف</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

