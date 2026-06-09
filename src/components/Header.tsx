'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, User, Menu, ChevronDown, Building2 } from 'lucide-react';
import Logo from './Logo';
import { useBusiness } from '@/src/context/BusinessContext';
import { useAuth } from '@/src/context/AuthContext';

interface HeaderProps {
  onMenuOpen: () => void;
}

export default function Header({ onMenuOpen }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { activeBusiness, businesses, setActiveBusinessId } = useBusiness();
  const [bizOpen, setBizOpen] = useState(false);
  const bizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (bizRef.current && !bizRef.current.contains(e.target as Node)) setBizOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const switchBusiness = (id: string) => {
    setActiveBusinessId(id);
    setBizOpen(false);
    router.refresh();
  };

  return (
    <header className="h-20 bg-white border-b border-nexa-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
        <button
          onClick={onMenuOpen}
          className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors md:hidden"
        >
          <Menu size={24} />
        </button>

        <div className="md:hidden">
          <Logo showText={false} />
        </div>

        <div className="relative shrink-0" ref={bizRef}>
          <button
            type="button"
            onClick={() => setBizOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-nexa-border/60 text-xs font-bold text-gray-800 max-w-[200px] md:max-w-[260px]"
          >
            <Building2 size={16} className="text-nexa-accent shrink-0" />
            <span className="truncate">{activeBusiness?.name ?? 'کسب‌وکار'}</span>
            <ChevronDown size={14} className="shrink-0 text-gray-400" />
          </button>
          {bizOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] bg-white rounded-xl shadow-lg border border-nexa-border py-1">
              {businesses.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => switchBusiness(b.id)}
                  className={`w-full text-right px-4 py-2.5 text-xs font-bold hover:bg-gray-50 ${
                    b.id === activeBusiness?.id ? 'text-nexa-accent' : 'text-gray-700'
                  }`}
                >
                  {b.name}
                </button>
              ))}
              <div className="border-t border-nexa-border my-1" />
              <button
                type="button"
                onClick={() => {
                  setBizOpen(false);
                  router.push('/businesses');
                }}
                className="w-full text-right px-4 py-2.5 text-xs font-bold text-nexa-accent hover:bg-gray-50"
              >
                مدیریت کسب‌وکارها
              </button>
            </div>
          )}
        </div>

        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="جستجوی سراسری در NEXA..."
            className="w-full bg-gray-50 border-none rounded-2xl py-2.5 pr-11 pl-4 text-sm focus:ring-2 focus:ring-nexa-accent/20 transition-all"
          />
        </div>
        <div className="sm:hidden">
          <button className="p-2.5 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">
            <Search size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2.5 text-gray-500 hover:bg-gray-50 rounded-xl relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-10 w-[1px] bg-gray-100 mx-1 md:mx-2"></div>

        <div className="flex items-center gap-2 md:gap-3 pl-1 md:pl-2 cursor-pointer hover:bg-gray-50 p-1 md:p-1.5 rounded-2xl transition-colors min-w-0">
          <div className="text-left hidden xs:block">
            <p className="text-xs md:text-sm font-bold text-gray-900 truncate max-w-[100px] md:max-w-none">
              {user?.displayName ?? 'کاربر'}
            </p>
            <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider font-medium">
              {user?.systemRole.nameFa ?? '—'}
            </p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-nexa-accent/10 flex items-center justify-center text-nexa-accent shrink-0">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
