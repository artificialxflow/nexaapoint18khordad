import React, { useState } from 'react';
import { 
  PenTool, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Globe, 
  ChevronLeft,
  Image as ImageIcon,
  Tag,
  Eye,
  MessageSquare,
  Settings,
  Share2,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  Trash2,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const initialPosts = [
  { id: '1', title: 'چگونه بهترین مبلمان را انتخاب کنیم؟', author: 'سارا علوی', date: '۱۴۰۴/۱۱/۳۰', views: '۱,۲۸۴', status: 'منتشر شده', category: 'راهنمای خرید' },
  { id: '2', title: 'ترندهای طراحی داخلی ۲۰۲۵', author: 'امیرحسین نکسایی', date: '۱۴۰۴/۱۱/۲۸', views: '۳,۴۵۰', status: 'منتشر شده', category: 'طراحی داخلی' },
  { id: '3', title: 'اهمیت نورپردازی در اتاق خواب', author: 'مریم سعیدی', date: '۱۴۰۴/۱۱/۲۵', views: '۸۹۰', status: 'پیش‌نویس', category: 'اتاق خواب' },
];

const initialCategories = [
  { id: '1', name: 'راهنمای خرید', count: 12, slug: 'buying-guide' },
  { id: '2', name: 'طراحی داخلی', count: 8, slug: 'interior-design' },
  { id: '3', name: 'اتاق خواب', count: 5, slug: 'bedroom' },
  { id: '4', name: 'اخبار شرکت', count: 20, slug: 'news' },
];

const initialComments = [
  { id: '1', user: 'محمد رضایی', text: 'مقاله بسیار مفیدی بود، ممنون از شما.', date: '۱۴۰۴/۱۱/۲۹', post: 'ترندهای طراحی داخلی ۲۰۲۵', status: 'approved' },
  { id: '2', user: 'زهرا حسینی', text: 'آیا امکان مشاوره حضوری هم وجود دارد؟', date: '۱۴۰۴/۱۱/۲۸', post: 'چگونه بهترین مبلمان را انتخاب کنیم؟', status: 'pending' },
];

const tabs = [
  { id: 'posts', label: 'مقالات بلاگ' },
  { id: 'categories', label: 'دسته‌بندی‌ها' },
  { id: 'comments', label: 'نظرات کاربران' },
  { id: 'seo', label: 'تنظیمات SEO بلاگ' },
];

export default function BlogAdmin() {
  const [activeTab, setActiveTab] = useState('posts');
  const [postsList, setPostsList] = useState(initialPosts);
  const [categoriesList, setCategoriesList] = useState(initialCategories);
  const [commentsList, setCommentsList] = useState(initialComments);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', author: 'مدیر سیستم', category: 'راهنمای خرید', status: 'منتشر شده' });

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    const post = {
      id: (postsList.length + 1).toString(),
      ...newPost,
      date: new Date().toLocaleDateString('fa-IR'),
      views: '۰'
    };
    setPostsList([post, ...postsList]);
    setIsModalOpen(false);
    setNewPost({ title: '', author: 'مدیر سیستم', category: 'راهنمای خرید', status: 'منتشر شده' });
  };

  const filteredPosts = postsList.filter(p => 
    p.title.includes(searchQuery) || p.author.includes(searchQuery)
  );

  const filteredComments = commentsList.filter(c => 
    c.user.includes(searchQuery) || c.text.includes(searchQuery)
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <motion.div 
            key="posts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'کل مقالات', value: postsList.length.toString(), icon: FileText, color: 'text-blue-600' },
                { label: 'بازدید کل', value: '۱۲۸K', icon: Eye, color: 'text-emerald-600' },
                { label: 'نظرات جدید', value: commentsList.filter(c => c.status === 'pending').length.toString(), icon: MessageSquare, color: 'text-purple-600' },
                { label: 'زمان مطالعه', value: '۸.۵m', icon: Clock, color: 'text-amber-600' },
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
                    placeholder="جستجوی مقاله..." 
                    className="w-full bg-white border border-nexa-border rounded-xl py-2 pr-10 pl-4 text-sm focus:ring-2 focus:ring-nexa-accent/20" 
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
                      <th className="px-6 py-4">عنوان مقاله</th>
                      <th className="px-6 py-4">نویسنده</th>
                      <th className="px-6 py-4">تاریخ انتشار</th>
                      <th className="px-6 py-4">بازدید</th>
                      <th className="px-6 py-4">وضعیت</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexa-border">
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                              <ImageIcon size={20} />
                            </div>
                            <span className="text-sm font-bold text-gray-900">{post.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{post.author}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-fa-num">{post.date}</td>
                        <td className="px-6 py-4 text-sm font-black text-gray-900 font-fa-num">{post.views}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            post.status === 'منتشر شده' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {post.status}
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
      case 'categories':
        return (
          <motion.div 
            key="categories"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {categoriesList.map((cat) => (
              <div key={cat.id} className="nexa-card p-6 flex justify-between items-center group cursor-pointer hover:border-nexa-accent transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-nexa-accent/10 group-hover:text-nexa-accent transition-all">
                    <Tag size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900">{cat.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-1 font-fa-num">{cat.count} مقاله مرتبط</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 mb-1">نامک</p>
                  <p className="text-[10px] font-mono text-gray-500">{cat.slug}</p>
                </div>
              </div>
            ))}
            <button className="nexa-card p-6 border-dashed border-2 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-nexa-accent hover:border-nexa-accent transition-all">
              <Plus size={24} />
              <span className="text-xs font-bold">افزودن دسته‌بندی جدید</span>
            </button>
          </motion.div>
        );
      case 'comments':
        return (
          <motion.div 
            key="comments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="nexa-card overflow-hidden"
          >
            <div className="p-6 border-b border-nexa-border bg-gray-50/50">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در نظرات..." 
                  className="w-full bg-white border border-nexa-border rounded-xl py-2 pr-10 pl-4 text-sm focus:ring-2 focus:ring-nexa-accent/20" 
                />
              </div>
            </div>
            <div className="divide-y divide-nexa-border">
              {filteredComments.map((comment) => (
                <div key={comment.id} className="p-6 hover:bg-gray-50/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <User size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{comment.user}</h4>
                        <p className="text-[10px] text-gray-400 font-fa-num">{comment.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {comment.status === 'pending' && (
                        <button className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-all">تایید نظر</button>
                      )}
                      <button className="p-2 text-gray-400 hover:text-rose-500 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{comment.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <FileText size={12} />
                    <span>در مقاله:</span>
                    <span className="font-bold text-nexa-accent">{comment.post}</span>
                  </div>
                </div>
              ))}
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
                <h3 className="text-lg font-black mb-6">تنظیمات سئو بلاگ</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">عنوان سئو بلاگ (SEO Title)</label>
                    <input type="text" defaultValue="مجله تخصصی دکوراسیون و نوآوری نکسا" className="w-full bg-white border border-nexa-border rounded-xl py-2 px-4 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">ساختار لینک مقالات</label>
                    <div className="flex gap-2">
                      <span className="bg-gray-100 px-3 py-2 rounded-lg text-xs text-gray-400 flex items-center">nexa.ir/blog/</span>
                      <input type="text" defaultValue="{post-slug}" className="flex-1 bg-white border border-nexa-border rounded-xl py-2 px-4 text-sm font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">اسکیماهای فعال (Schema Markup)</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Article Schema', 'Breadcrumb Schema', 'Review Schema', 'FAQ Schema'].map((schema, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-nexa-border">
                          <input type="checkbox" className="w-4 h-4 accent-nexa-accent" defaultChecked />
                          <span className="text-xs text-gray-600">{schema}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-nexa-border flex justify-end">
                  <button className="nexa-btn-primary">بروزرسانی تنظیمات سئو</button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="nexa-card p-6 bg-purple-600 text-white">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Share2 size={18} />
                  وضعیت ایندکس مقالات
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs opacity-70">مقالات ایندکس شده</span>
                    <span className="text-lg font-black font-fa-num">۴۲ / ۴۵</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[93%]"></div>
                  </div>
                  <p className="text-[10px] opacity-60 leading-relaxed">
                    ۳ مقاله جدید در صف ایندکس گوگل قرار دارند. زمان تقریبی: ۲۴ ساعت آینده.
                  </p>
                </div>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">مدیریت محتوا و بلاگ</h1>
          <p className="text-gray-500 mt-1">تولید محتوا، مدیریت نویسندگان و بهینه‌سازی موتورهای جستجو</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-nexa-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Globe size={18} />
            مشاهده بلاگ
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="nexa-btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            نوشتن مقاله جدید
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

      {/* New Post Modal */}
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
                <h3 className="text-lg font-black text-gray-900">نوشتن مقاله جدید</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddPost} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">عنوان مقاله</label>
                  <input 
                    required
                    type="text" 
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    placeholder="مثال: راهنمای چیدمان دکوراسیون مدرن"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">دسته‌بندی</label>
                    <select 
                      value={newPost.category}
                      onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20"
                    >
                      {categoriesList.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">وضعیت انتشار</label>
                    <select 
                      value={newPost.status}
                      onChange={(e) => setNewPost({...newPost, status: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20"
                    >
                      <option value="منتشر شده">منتشر شده</option>
                      <option value="پیش‌نویس">پیش‌نویس</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">نویسنده</label>
                  <input 
                    type="text" 
                    value={newPost.author}
                    onChange={(e) => setNewPost({...newPost, author: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-nexa-accent/20" 
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 nexa-btn-primary py-3">انتشار مقاله</button>
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
