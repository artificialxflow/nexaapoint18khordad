'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Coins,
  FolderKanban,
  LayoutTemplate,
  Bell,
  Shield,
  List,
  Save,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProjectsSection from '@/src/views/settings/ProjectsSection';
import BusinessFiscalSection from '@/src/views/settings/BusinessFiscalSection';
import ExchangeRatesSection from '@/src/views/settings/ExchangeRatesSection';
import AccessControlSection from '@/src/views/settings/AccessControlSection';
import FormBuilderSection from '@/src/views/settings/FormBuilderSection';
import NotificationsSettingsSection from '@/src/views/settings/NotificationsSettingsSection';
import PicklistsSection from '@/src/views/settings/PicklistsSection';

export type SettingsSectionId =
  | 'projects'
  | 'business'
  | 'exchange'
  | 'access'
  | 'form'
  | 'notifications'
  | 'picklists';

const SECTIONS: {
  id: SettingsSectionId;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: 'projects', label: 'پروژه‌ها', icon: <FolderKanban size={14} /> },
  { id: 'business', label: 'کسب‌وکار و سال مالی', icon: <Building2 size={14} /> },
  { id: 'exchange', label: 'نرخ ارز', icon: <Coins size={14} /> },
  { id: 'access', label: 'کاربران و دسترسی', icon: <Shield size={14} /> },
  { id: 'form', label: 'فرم‌ساز', icon: <LayoutTemplate size={14} /> },
  { id: 'notifications', label: 'اعلانات', icon: <Bell size={14} /> },
  { id: 'picklists', label: 'فهرست‌های انتخابی', icon: <List size={14} /> },
];

const VALID_TABS = new Set<string>(SECTIONS.map((s) => s.id));

function parseTab(raw: string | null): SettingsSectionId | null {
  if (raw === 'users') return 'access';
  if (!raw || !VALID_TABS.has(raw)) return null;
  return raw as SettingsSectionId;
}

function SettingsInner({ initialSection }: { initialSection?: SettingsSectionId }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = useMemo(() => parseTab(searchParams.get('tab')), [searchParams]);

  const [section, setSection] = useState<SettingsSectionId>(() => initialSection ?? tabFromUrl ?? 'projects');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const next = initialSection ?? tabFromUrl;
    if (next) setSection(next);
  }, [initialSection, tabFromUrl]);

  useEffect(() => {
    if (searchParams.get('tab') === 'users') {
      router.replace('/dashboard/settings?tab=access');
    }
  }, [searchParams, router]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    }, 600);
  };

  const content = () => {
    switch (section) {
      case 'projects':
        return <ProjectsSection />;
      case 'business':
        return <BusinessFiscalSection />;
      case 'exchange':
        return <ExchangeRatesSection />;
      case 'access':
        return <AccessControlSection />;
      case 'form':
        return <FormBuilderSection />;
      case 'notifications':
        return <NotificationsSettingsSection />;
      case 'picklists':
        return <PicklistsSection />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">تنظیمات سیستم</h1>
          <p className="text-sm text-gray-500 mt-1">
            پروژه، کسب‌وکار، سال مالی، ارز، دسترسی‌ها، فرم‌ساز و اعلانات — مطابق ماژول ۰۸
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-100"
              >
                <CheckCircle2 size={14} />
                ذخیره شد
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="nexa-btn-primary flex items-center gap-2 text-sm py-2.5 px-4"
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            ذخیره نمایشی
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
              section === item.id ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="nexa-card p-6 md:p-8 min-h-[480px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {content()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function SettingsFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-gray-100 rounded-xl w-1/3" />
      <div className="h-12 bg-gray-100 rounded-2xl" />
      <div className="nexa-card min-h-[480px] bg-gray-50" />
    </div>
  );
}

export default function Settings({ initialSection }: { initialSection?: SettingsSectionId }) {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsInner initialSection={initialSection} />
    </Suspense>
  );
}
