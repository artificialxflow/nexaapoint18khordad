'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Search, 
  Heart, 
  User, 
  Filter, 
  Star,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Logo from '../components/Logo';

const products = [
  { id: 1, name: 'مبلمان ال نئوکلاسیک آوا', price: '۴۵,۰۰۰,۰۰۰', category: 'مبلمان', rating: 4.8, image: 'https://picsum.photos/seed/sofa1/600/600' },
  { id: 2, name: 'سرویس خواب مدل کویین', price: '۳۲,۰۰۰,۰۰۰', category: 'سرویس خواب', rating: 4.9, image: 'https://picsum.photos/seed/bed1/600/600' },
  { id: 3, name: 'میز نهارخوری ۸ نفره لوکس', price: '۱۸,۵۰۰,۰۰۰', category: 'نهارخوری', rating: 4.7, image: 'https://picsum.photos/seed/table1/600/600' },
  { id: 4, name: 'کنسول و آینه طرح رومی', price: '۱۲,۰۰۰,۰۰۰', category: 'دکوراسیون', rating: 4.6, image: 'https://picsum.photos/seed/console1/600/600' },
  { id: 5, name: 'صندلی تک نفره مدرن', price: '۴,۸۰۰,۰۰۰', category: 'صندلی', rating: 4.5, image: 'https://picsum.photos/seed/chair1/600/600' },
  { id: 6, name: 'میز جلو مبلی طرح سنگ', price: '۷,۵۰۰,۰۰۰', category: 'میز', rating: 4.4, image: 'https://picsum.photos/seed/table2/600/600' },
];

export default function StoreFrontend() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => router.push('/')}>
              <Logo />
            </button>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-bold text-nexa-accent border-b-2 border-nexa-accent pb-1">همه محصولات</a>
              <a href="#" className="text-sm font-bold text-gray-500 hover:text-nexa-accent transition-colors">مبلمان</a>
              <a href="#" className="text-sm font-bold text-gray-500 hover:text-nexa-accent transition-colors">سرویس خواب</a>
              <a href="#" className="text-sm font-bold text-gray-500 hover:text-nexa-accent transition-colors">دکوراسیون</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="جستجو در محصولات..." 
                className="bg-gray-100 border-none rounded-xl py-2 pr-10 pl-4 text-sm w-64 focus:ring-2 focus:ring-nexa-accent/20"
              />
            </div>
            <button className="p-2 text-gray-500 hover:text-nexa-accent transition-colors"><Heart size={20} /></button>
            <button className="p-2 text-gray-500 hover:text-nexa-accent transition-colors relative">
              <ShoppingBag size={20} />
              <span className="absolute top-0 right-0 w-4 h-4 bg-nexa-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">۲</span>
            </button>
            <button className="p-2 text-gray-500 hover:text-nexa-accent transition-colors"><User size={20} /></button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative h-[400px] rounded-[2.5rem] overflow-hidden group">
            <img 
              src="https://picsum.photos/seed/store-hero/1920/800" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              alt="Store Hero"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-12">
              <div className="max-w-lg text-white">
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block px-3 py-1 bg-nexa-accent rounded-full text-[10px] font-bold mb-4"
                >
                  کالکشن جدید بهار ۱۴۰۴
                </motion.span>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl font-black mb-6"
                >
                  زیبایی را به خانه خود هدیه دهید
                </motion.h1>
                <motion.button 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-bold flex items-center gap-2 hover:bg-nexa-accent hover:text-white transition-all"
                >
                  مشاهده کالکشن
                  <ArrowLeft size={18} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-black">محصولات برتر</h2>
          <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-nexa-accent transition-colors">
            <Filter size={18} />
            فیلتر محصولات
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <motion.div 
              key={product.id}
              whileHover={{ y: -10 }}
              className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group"
            >
              <div className="relative aspect-square overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <button className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-md rounded-xl text-gray-400 hover:text-rose-500 transition-colors">
                  <Heart size={18} />
                </button>
                <div className="absolute bottom-4 right-4 px-2 py-1 bg-white/80 backdrop-blur-md rounded-lg flex items-center gap-1 text-[10px] font-bold">
                  <Star size={12} className="text-amber-500 fill-amber-500" />
                  {product.rating}
                </div>
              </div>
              <div className="p-6">
                <p className="text-[10px] font-bold text-nexa-accent mb-1 uppercase tracking-wider">{product.category}</p>
                <h3 className="text-sm font-bold text-gray-900 mb-4 group-hover:text-nexa-accent transition-colors">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-gray-900 font-fa-num">{product.price}</span>
                    <span className="text-[10px] text-gray-400 mr-1">تومان</span>
                  </div>
                  <button className="p-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-nexa-accent hover:text-white transition-all">
                    <ShoppingBag size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button className="px-10 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-500 hover:border-nexa-accent hover:text-nexa-accent transition-all">
            مشاهده همه محصولات
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <span className="text-3xl font-black tracking-tighter text-nexa-accent">NEXA STORE</span>
            <p className="text-gray-500 text-sm mt-4 leading-relaxed max-w-sm">
              تجربه خرید آنلاین مبلمان و دکوراسیون با کیفیت برتر و طراحی‌های منحصر به فرد. ما زیبایی را به خانه‌های شما می‌آوریم.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-black mb-6">لینک‌های سریع</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-bold">
              <li><a href="#" className="hover:text-nexa-accent transition-colors">درباره ما</a></li>
              <li><a href="#" className="hover:text-nexa-accent transition-colors">تماس با ما</a></li>
              <li><a href="#" className="hover:text-nexa-accent transition-colors">قوانین و مقررات</a></li>
              <li><a href="#" className="hover:text-nexa-accent transition-colors">سوالات متداول</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black mb-6">خبرنامه</h4>
            <p className="text-xs text-gray-500 mb-4">برای اطلاع از جدیدترین تخفیف‌ها عضو شوید.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="ایمیل شما" className="bg-gray-100 border-none rounded-xl py-2 px-4 text-xs flex-1" />
              <button className="px-4 py-2 bg-nexa-accent text-white rounded-xl text-xs font-bold">عضویت</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
