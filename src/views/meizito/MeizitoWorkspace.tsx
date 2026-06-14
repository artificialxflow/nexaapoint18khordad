'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutGrid,
  Columns3,
  FolderKanban,
  Mail,
  StickyNote,
  Star,
  BarChart3,
  Info,
  Calendar,
  Network,
  Phone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  type MeizitoTabId,
  type MeizitoReportsSection,
  MEIZITO_MOBILE_NAV_TABS,
  MEIZITO_NAV_TABS,
  MEIZITO_TAB_LABELS,
  isMeizitoTabId,
  isMeizitoReportsSection,
  MEIZITO_LAST_TAB_KEY,
} from '@/src/types/meizito';
import { useMeizito } from '@/src/context/MeizitoContext';
import DashboardPanel from './panels/DashboardPanel';
import BoardsPanel from './panels/BoardsPanel';
import ProjectsPanel from './panels/ProjectsPanel';
import LettersPanel from './panels/LettersPanel';
import NotesPanel from './panels/NotesPanel';
import StarredPanel from './panels/StarredPanel';
import MonitoringPanel from './panels/MonitoringPanel';
import BoardInfoPanel from './panels/BoardInfoPanel';
import CalendarPanel from './panels/CalendarPanel';
import CommsHubPanel from './panels/CommsHubPanel';
import PhoneDirectoryPanel from './panels/PhoneDirectoryPanel';
import ReportsPanel from './panels/ReportsPanel';

const TAB_ICONS: Record<MeizitoTabId, React.ReactNode> = {
  dashboard: <LayoutGrid size={14} />,
  chat: <LayoutGrid size={14} />,
  boards: <Columns3 size={14} />,
  reports: <BarChart3 size={14} />,
  letters: <Mail size={14} />,
  notes: <StickyNote size={14} />,
  projects: <FolderKanban size={14} />,
  calendar: <Calendar size={14} />,
  comms: <Network size={14} />,
  phone: <Phone size={14} />,
  starred: <Star size={14} />,
  monitoring: <BarChart3 size={14} />,
  boardInfo: <Info size={14} />,
};

function resolveTab(tabParam: string | null): MeizitoTabId {
  if (tabParam === 'chat') return 'dashboard';
  if (isMeizitoTabId(tabParam)) return tabParam;
  if (typeof window !== 'undefined') {
    const last = window.localStorage.getItem(MEIZITO_LAST_TAB_KEY);
    if (last === 'chat') return 'dashboard';
    if (isMeizitoTabId(last)) return last;
  }
  return 'dashboard';
}

export default function MeizitoWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const sectionParam = searchParams.get('section');
  const reportsSection: MeizitoReportsSection = isMeizitoReportsSection(sectionParam)
    ? sectionParam
    : 'daily';
  const { mockUsers, currentUserId, setCurrentUserId, letters, useMockUserSwitcher } = useMeizito();
  const [meizitoTab, setMeizitoTab] = useState<MeizitoTabId>('dashboard');

  const openLettersCount = useMemo(
    () => letters.filter((l) => l.status === 'open' && l.box !== 'archive').length,
    [letters]
  );

  const setTab = useCallback(
    (id: MeizitoTabId, section?: MeizitoReportsSection) => {
      if (id === 'chat') {
        router.push('/dashboard/chats');
        return;
      }
      setMeizitoTab(id);
      window.localStorage.setItem(MEIZITO_LAST_TAB_KEY, id);
      const params = new URLSearchParams({ tab: id });
      if (id === 'reports' && section) params.set('section', section);
      router.replace(`/dashboard/tasks?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const setReportsSection = useCallback(
    (section: MeizitoReportsSection) => {
      const params = new URLSearchParams({ tab: 'reports', section });
      router.replace(`/dashboard/tasks?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    if (tabParam === 'chat') {
      router.replace('/dashboard/chats');
      return;
    }
    setMeizitoTab(resolveTab(tabParam));
  }, [tabParam, router]);

  const render = () => {
    switch (meizitoTab) {
      case 'dashboard':
        return <DashboardPanel onGoTab={setTab} />;
      case 'boards':
        return <BoardsPanel />;
      case 'projects':
        return <ProjectsPanel />;
      case 'letters':
        return <LettersPanel />;
      case 'notes':
        return <NotesPanel />;
      case 'reports':
        return (
          <ReportsPanel section={reportsSection} onSectionChange={setReportsSection} />
        );
      case 'calendar':
        return <CalendarPanel onGoTab={setTab} />;
      case 'comms':
        return <CommsHubPanel onGoTab={setTab} />;
      case 'phone':
        return <PhoneDirectoryPanel />;
      case 'starred':
        return <StarredPanel />;
      case 'monitoring':
        return <MonitoringPanel />;
      case 'boardInfo':
        return <BoardInfoPanel />;
      default:
        return null;
    }
  };

  const tabButtonClass = (active: boolean) =>
    `flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
      active ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-400 hover:text-gray-700'
    }`;

  const renderTabButton = (id: MeizitoTabId) => {
    if (id === 'chat') return null;
    return (
      <button key={id} type="button" onClick={() => setTab(id)} className={tabButtonClass(meizitoTab === id)}>
        {TAB_ICONS[id]}
        {MEIZITO_TAB_LABELS[id]}
        {id === 'letters' && openLettersCount > 0 && (
          <span className="text-[9px] font-fa-num bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">
            {openLettersCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">میز کار</h1>
          <p className="text-sm text-gray-500 mt-1">
            گزارش روز، بازدید حضوری، وظایف و مکاتبه — گفتگو از منوی «گفتگوها»
          </p>
        </div>
        <div className="flex items-center gap-2">
          {useMockUserSwitcher && (
            <>
              <label className="text-[10px] text-gray-500 font-bold">کاربر:</label>
              <select
                value={currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value)}
                className="bg-gray-50 border border-nexa-border rounded-xl px-3 py-2 text-xs font-bold min-w-[140px]"
              >
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}{' '}
                    {u.role === 'senior_manager' ? '(مدیر بالاتر)' : u.role === 'manager' ? '(مدیر)' : ''}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      <div className="hidden md:flex gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar items-center">
        {MEIZITO_NAV_TABS.map(renderTabButton)}
      </div>

      <div className="flex md:hidden flex-nowrap gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar items-center scroll-smooth">
        {MEIZITO_MOBILE_NAV_TABS.map(renderTabButton)}
      </div>

      <div className="nexa-card p-6 md:p-8 min-h-[520px] min-w-0 overflow-x-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={meizitoTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {render()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
