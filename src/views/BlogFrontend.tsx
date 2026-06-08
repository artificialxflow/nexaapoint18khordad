'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Clock, 
  User, 
  ChevronLeft,
  Tag,
  Share2,
  Bookmark
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Logo from '../components/Logo';

const posts = [
  { id: 1, title: 'چگونه بهترین مبلمان را برای فضای کوچک انتخاب کنیم؟', excerpt: 'در این مقاله به بررسی راهکارهای هوشمندانه برای چیدمان فضاهای کوچک و انتخاب مبلمان مناسب می‌پردازیم...', date: '۱۴۰۴/۱۱/۳۰', author: 'سارا علوی', category: 'دکوراسیون', image: 'https://picsum.photos/seed/blog1/800/500' },
  { id: 2, title: 'ترندهای طراحی داخلی در سال ۲۰۲۵', excerpt: 'بررسی جدیدترین رنگ‌ها، متریال‌ها و سبک‌های طراحی که در سال جدید میلادی دنیای دکوراسیون را متحول می‌کنند...', date: '۱۴۰۴/۱۱/۲۵', author: 'امیرحسین نکسایی', category: 'ترندها', image: 'https://picsum.photos/seed/blog2/800/500' },
  { id: 3, title: 'اهمیت نورپردازی در اتاق خواب', excerpt: 'نورپردازی صحیح می‌تواند کیفیت خواب و آرامش شما را به شدت افزایش دهد. در اینجا ۵ نکته کلیدی را مرور می‌کنیم...', date: '۱۴۰۴/۱۱/۲۰', author: 'مریم سعیدی', category: 'آموزشی', image: 'https://picsum.photos/seed/blog3/800/500' },
];

export default function BlogFrontend() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => router.push('/')}>
              <Logo />
            </button>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-bold text-nexa-accent">همه مقالات</a>
              <a href="#" className="text-sm font-bold text-gray-500 hover:text-nexa-accent transition-colors">دکوراسیون</a>
              <a href="#" className="text-sm font-bold text-gray-500 hover:text-nexa-accent transition-colors">تکنولوژی</a>
              <a href="#" className="text-sm font-bold text-gray-500 hover:text-nexa-accent transition-colors">سبک زندگی</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-nexa-accent transition-colors"><Search size={20} /></button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-nexa-primary text-white rounded-xl font-bold text-xs"
            >
              ورود به پنل
            </button>
          </div>
        </div>
      </header>

      {/* Featured Post */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-[500px] rounded-[3rem] overflow-hidden group cursor-pointer"
          >
            <img 
              src="https://picsum.photos/seed/featured-blog/1600/900" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              alt="Featured Post"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-12">
              <div className="max-w-2xl">
                <span className="inline-block px-3 py-1 bg-nexa-accent text-white text-[10px] font-bold rounded-full mb-4">مقاله ویژه</span>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                  هنر چیدمان مدرن: چگونه خانه‌ای با هویت بسازیم؟
                </h1>
                <div className="flex items-center gap-6 text-white/60 text-sm font-bold">
                  <span className="flex items-center gap-2"><User size={16} /> علی محمدی</span>
                  <span className="flex items-center gap-2"><Clock size={16} /> ۱۰ دقیقه مطالعه</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Blog Feed */}
      <main className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Posts List */}
          <div className="lg:col-span-2 space-y-16">
            {posts.map((post) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[16/9] rounded-[2rem] overflow-hidden mb-8">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 right-6">
                    <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-xs font-black text-nexa-accent shadow-lg">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-xs text-gray-400 font-bold">
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {post.date}</span>
                    <span className="flex items-center gap-1.5"><User size={14} /> {post.author}</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 group-hover:text-nexa-accent transition-colors leading-tight">
                    {post.title}
                  </h2>
                  <p className="text-gray-500 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <button className="flex items-center gap-2 text-sm font-black text-nexa-accent group-hover:gap-4 transition-all">
                    ادامه مطلب
                    <ChevronLeft size={18} />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="space-y-12">
            {/* Categories */}
            <div className="bg-gray-50 p-8 rounded-[2rem]">
              <h3 className="text-lg font-black mb-6">دسته‌بندی‌ها</h3>
              <div className="space-y-4">
                {[
                  { name: 'طراحی داخلی', count: 12 },
                  { name: 'مبلمان و چیدمان', count: 8 },
                  { name: 'تکنولوژی در خانه', count: 5 },
                  { name: 'سبک زندگی', count: 15 },
                ].map((cat, idx) => (
                  <button key={idx} className="w-full flex items-center justify-between text-sm font-bold text-gray-500 hover:text-nexa-accent transition-colors group">
                    <span>{cat.name}</span>
                    <span className="px-2 py-0.5 bg-white rounded-lg text-[10px] font-fa-num group-hover:bg-nexa-accent group-hover:text-white transition-all">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div>
              <h3 className="text-lg font-black mb-6">برچسب‌های داغ</h3>
              <div className="flex flex-wrap gap-2">
                {['مدرن', 'مینیمال', 'چوب', 'نورپردازی', 'اتاق_خواب', 'آشپزخانه', 'هوشمند'].map((tag, idx) => (
                  <button key={idx} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-400 hover:border-nexa-accent hover:text-nexa-accent transition-all">
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-nexa-primary p-8 rounded-[2rem] text-white">
              <h3 className="text-lg font-black mb-4">عضویت در خبرنامه</h3>
              <p className="text-white/60 text-xs mb-6 leading-relaxed">جدیدترین مقالات و آموزش‌ها را در ایمیل خود دریافت کنید.</p>
              <div className="space-y-3">
                <input type="email" placeholder="ایمیل شما" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs" />
                <button className="w-full py-3 bg-nexa-accent text-white rounded-xl text-xs font-black shadow-lg shadow-nexa-accent/20">تایید عضویت</button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-20 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-3xl font-black tracking-tighter text-nexa-accent">NEXA BLOG</span>
            <p className="text-gray-400 text-sm mt-2">مرجع تخصصی دکوراسیون و نوآوری در کسب‌وکار</p>
          </div>
          <div className="flex gap-6">
            <button className="p-3 bg-white rounded-2xl text-gray-400 hover:text-nexa-accent transition-all shadow-sm"><Share2 size={20} /></button>
            <button className="p-3 bg-white rounded-2xl text-gray-400 hover:text-nexa-accent transition-all shadow-sm"><Bookmark size={20} /></button>
          </div>
          <p className="text-gray-400 text-xs font-fa-num">© ۱۴۰۴ تمامی حقوق محفوظ است.</p>
        </div>
      </footer>
    </div>
  );
}
