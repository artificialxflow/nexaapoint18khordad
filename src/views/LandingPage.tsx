 'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Zap, 
  Shield, 
  TrendingUp, 
  LayoutDashboard, 
  MessageSquare, 
  Factory,
  CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Logo from '../components/Logo';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-gray-500 hover:text-nexa-accent transition-colors">ویژگی‌ها</a>
            <button 
              onClick={() => router.push('/shop')}
              className="text-sm font-bold text-gray-500 hover:text-nexa-accent transition-colors"
            >
              فروشگاه
            </button>
            <button 
              onClick={() => router.push('/blog')}
              className="text-sm font-bold text-gray-500 hover:text-nexa-accent transition-colors"
            >
              بلاگ
            </button>
            <a href="#about" className="text-sm font-bold text-gray-500 hover:text-nexa-accent transition-colors">درباره ما</a>
            <button 
              onClick={() => router.push('/login')}
              className="px-6 py-2.5 bg-nexa-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-nexa-primary/20 hover:scale-105 transition-all"
            >
              ورود به پنل مدیریت
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexa-accent/10 text-nexa-accent text-xs font-bold mb-6">
              <Zap size={14} />
              نسل جدید مدیریت هوشمند کسب‌وکار
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
              نقطه بعدی <span className="text-nexa-accent">نوآوری</span> در صنعت شما
            </h1>
            <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-xl">
              NEXA یک پلتفرم یکپارچه ERP است که با تمرکز بر تجربه کاربری لوکس و هوش مصنوعی، تمامی فرآیندهای تولید، فروش و ارتباطات شما را متحول می‌کند.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => router.push('/login')}
                className="px-10 py-5 bg-nexa-primary text-white rounded-2xl font-black text-lg shadow-2xl shadow-nexa-primary/30 flex items-center justify-center gap-3 hover:scale-105 transition-all"
              >
                شروع تجربه هوشمند
                <ArrowLeft size={20} />
              </button>
              <button 
                onClick={() => router.push('/mobile')}
                className="px-10 py-5 bg-white border-2 border-nexa-primary text-nexa-primary rounded-2xl font-black text-lg hover:bg-nexa-primary/5 transition-all flex items-center justify-center gap-3"
              >
                نسخه موبایل (PWA)
                <LayoutDashboard size={20} />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] border border-gray-100">
              <img 
                src="https://picsum.photos/seed/nexa-dashboard/1200/800" 
                alt="Nexa Dashboard Preview" 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-nexa-accent/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-black mb-4">چرا NEXA را انتخاب کنید؟</h2>
            <p className="text-gray-500">ما تمامی ابزارهای مورد نیاز برای رشد بیزینس شما را در یک محیط زیبا و قدرتمند جمع کرده‌ایم.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'مدیریت ۳۶۰ درجه مشتریان',
                desc: 'از اولین بازدید تا وفاداری همیشگی، تمامی تعاملات مشتری را با دقت میکروسکوپی رصد کنید.',
                icon: Shield,
                color: 'bg-emerald-50 text-emerald-600'
              },
              {
                title: 'اتوماسیون هوشمند تولید',
                desc: 'دستور تولید خودکار، مدیریت پارچه و رهگیری لحظه‌ای مراحل ساخت با کمترین خطا.',
                icon: Factory,
                color: 'bg-blue-50 text-blue-600'
              },
              {
                title: 'تحلیل‌های پیشرفته BI',
                desc: 'گزارشات LRFM و پیش‌بینی فروش مبتنی بر داده برای تصمیم‌گیری‌های استراتژیک.',
                icon: TrendingUp,
                color: 'bg-purple-50 text-purple-600'
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-8`}>
                  <feature.icon size={32} />
                </div>
                <h3 className="text-xl font-black mb-4">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-nexa-primary text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'مشتری فعال', value: '۱,۲۰۰+' },
              { label: 'سفارش موفق', value: '۴۵,۰۰۰+' },
              { label: 'صرفه‌جویی در زمان', value: '۳۵٪' },
              { label: 'رضایت کاربران', value: '۹۹٪' }
            ].map((stat, idx) => (
              <div key={idx}>
                <p className="text-4xl md:text-5xl font-black mb-2 font-fa-num">{stat.value}</p>
                <p className="text-white/40 text-sm font-bold uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white rounded-full"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <Logo />
            <p className="text-gray-400 text-sm mt-2">NexaPoint: Your Next Point of Innovation</p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-gray-400 hover:text-nexa-accent transition-colors"><MessageSquare size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-nexa-accent transition-colors"><LayoutDashboard size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-nexa-accent transition-colors"><Zap size={20} /></a>
          </div>
          <p className="text-gray-400 text-xs font-fa-num">© ۱۴۰۴ تمامی حقوق برای نکساپوینت محفوظ است.</p>
        </div>
      </footer>
    </div>
  );
}
