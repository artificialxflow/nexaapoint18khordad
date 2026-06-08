'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Factory, 
  Plus, 
  Bell, 
  Search,
  TrendingUp,
  Clock,
  ChevronLeft,
  UserCircle,
  Camera,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type MobileTab = 'home' | 'crm' | 'chat' | 'production' | 'profile';

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-8">
              <div>
                <h1 className="text-2xl font-black text-gray-900">سلام، امیرحسین</h1>
                <p className="text-xs text-gray-500 font-medium">امروز ۳۰ بهمن ۱۴۰۴</p>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-gray-100">
                  <Bell size={20} className="text-gray-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full text-[8px] flex items-center justify-center text-white font-bold">۳</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="px-6 grid grid-cols-2 gap-4">
              <div className="bg-nexa-primary p-5 rounded-[2rem] text-white shadow-xl shadow-nexa-primary/20">
                <TrendingUp size={20} className="text-nexa-accent mb-3" />
                <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">فروش امروز</p>
                <p className="text-lg font-black font-fa-num">۴۵,۰۰۰,۰۰۰</p>
              </div>
              <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                <Users size={20} className="text-blue-500 mb-3" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">بازدید جدید</p>
                <p className="text-lg font-black text-gray-900 font-fa-num">۱۲</p>
              </div>
            </div>

            {/* Active Tasks */}
            <div className="px-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900">وضعیت تولید</h3>
                <button className="text-[10px] font-bold text-nexa-accent">مشاهده همه</button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'مبلمان آوا', status: 'رویه کوبی', progress: 85, color: 'bg-emerald-500' },
                  { label: 'سرویس خواب', status: 'رنگ‌کاری', progress: 45, color: 'bg-amber-500' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <Factory size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-xs font-bold text-gray-900">{item.label}</p>
                        <span className="text-[10px] font-bold text-gray-400">{item.status}</span>
                      </div>
                      <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-6">
              <h3 className="font-black text-gray-900 mb-4">دسترسی سریع</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                {[
                  { label: 'فاکتور', icon: Plus, color: 'bg-rose-50 text-rose-600' },
                  { label: 'بازدید', icon: Users, color: 'bg-blue-50 text-blue-600' },
                  { label: 'دوربین', icon: Camera, color: 'bg-purple-50 text-purple-600' },
                  { label: 'جستجو', icon: Search, color: 'bg-gray-50 text-gray-600' },
                ].map((action, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className={`aspect-square rounded-2xl ${action.color} flex items-center justify-center shadow-sm`}>
                      <action.icon size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">{action.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'crm':
        return (
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-black text-gray-900">مدیریت مشتریان</h1>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="جستجوی مشتری..." className="w-full bg-white border border-gray-100 rounded-2xl py-3 pr-10 pl-4 text-sm" />
            </div>
            <div className="space-y-4">
              {[
                { name: 'سارا احمدی', level: 'برلیان', phone: '۰۹۱۲۳۴۵۶۷۸۹' },
                { name: 'رضا علوی', level: 'گلد', phone: '۰۹۱۸۷۶۵۴۳۲۱' },
                { name: 'مریم سعیدی', level: 'سیلور', phone: '۰۹۳۵۱۱۱۲۲۳۳' },
              ].map((c, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-gray-400">{c.name[0]}</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{c.name}</p>
                      <p className="text-[10px] text-gray-400 font-fa-num">{c.phone}</p>
                    </div>
                  </div>
                  <ChevronLeft size={16} className="text-gray-300" />
                </div>
              ))}
            </div>
            <a
              href="/dashboard/tasks?tab=dashboard"
              className="fixed bottom-24 left-6 right-6 py-4 bg-nexa-accent text-white rounded-2xl font-bold shadow-xl shadow-nexa-accent/20 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              ثبت بازدید حضوری
            </a>
          </div>
        );
      case 'chat':
        return (
          <div className="flex flex-col h-[calc(100vh-80px)]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <h1 className="text-2xl font-black text-gray-900">گفتگوها</h1>
              <div className="flex gap-4">
                <Search size={20} className="text-gray-400" />
                <Plus size={20} className="text-gray-400" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {[
                { name: 'واحد تولید', msg: 'فایل QC رو فرستادم.', time: '۱۰:۳۰', unread: 2 },
                { name: 'تیم فروش', msg: 'جلسه کنسل شد.', time: '۰۹:۱۵', unread: 0 },
                { name: 'تامین قطعات', msg: 'پارچه‌ها رسید.', time: 'دیروز', unread: 0 },
              ].map((chat, idx) => (
                <div key={idx} className="flex items-center gap-4 p-2">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-lg">{chat.name[0]}</div>
                  <div className="flex-1 min-w-0 border-b border-gray-50 pb-4">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-bold text-gray-900">{chat.name}</h4>
                      <span className="text-[10px] text-gray-400 font-fa-num">{chat.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500 truncate">{chat.msg}</p>
                      {chat.unread > 0 && <span className="w-5 h-5 bg-nexa-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full">{chat.unread}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[80vh] text-gray-400 px-10 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6">
              <LayoutDashboard size={40} />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">در حال توسعه</h2>
            <p className="text-sm">این بخش در نسخه موبایل به زودی فعال خواهد شد.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex justify-center">
      {/* Mobile Frame Simulation (Optional, but good for preview) */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="h-20 bg-white border-t border-gray-100 flex items-center justify-around px-6 shrink-0 z-50">
          {[
            { id: 'home', icon: LayoutDashboard, label: 'خانه' },
            { id: 'crm', icon: Users, label: 'مشتریان' },
            { id: 'chat', icon: MessageSquare, label: 'چت' },
            { id: 'production', icon: Factory, label: 'تولید' },
            { id: 'profile', icon: UserCircle, label: 'پروفایل' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MobileTab)}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={`p-2 rounded-xl transition-all ${
                activeTab === tab.id ? 'bg-nexa-accent text-white shadow-lg shadow-nexa-accent/20' : 'text-gray-400 group-hover:text-gray-600'
              }`}>
                <tab.icon size={20} />
              </div>
              <span className={`text-[8px] font-bold ${activeTab === tab.id ? 'text-nexa-accent' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
