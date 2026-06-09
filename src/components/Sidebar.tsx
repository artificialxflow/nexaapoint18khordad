import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Target,
  Factory,
  ShoppingCart,
  TrendingUp,
  CheckSquare,
  Truck,
  ShoppingBag,
  Wallet,
  BookOpen,
  Warehouse,
  Megaphone,
  Network,
  UserCircle,
  LifeBuoy,
  Zap,
  Settings,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  LogOut,
  Search,
  BarChart3,
  GitBranch,
  Store,
  PenTool,
  X,
  Mail,
  ClipboardList,
  Calendar,
  Phone,
} from 'lucide-react';
import { ViewType } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

import Logo from './Logo';
import { useAuth } from '@/src/context/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

const SIDEBAR_SCROLL_KEY = 'nexa-sidebar-scroll-top';
const SIDEBAR_GROUPS_KEY = 'nexa-sidebar-groups';
const QUICK_GROUP_ID = 'quick';

type SidebarItemId = ViewType | 'sidebar-calendar' | 'sidebar-letters' | 'sidebar-phone';

type MenuItem = {
  id: SidebarItemId;
  label: string;
  icon: React.ElementType;
  href?: string;
  matchPath?: string;
  matchTab?: string;
  matchView?: ViewType;
  /** برای میز کار بدون tab — فقط وقتی tab در URL نیست */
  matchTasksHome?: boolean;
};

type MenuGroup = {
  id: string;
  title: string;
  defaultExpanded: boolean;
  collapsible: boolean;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    id: QUICK_GROUP_ID,
    title: 'دسترسی سریع',
    defaultExpanded: true,
    collapsible: false,
    items: [
      {
        id: 'dashboard',
        label: 'داشبورد',
        icon: LayoutDashboard,
        href: '/dashboard/dashboard',
        matchView: 'dashboard',
      },
      {
        id: 'tasks',
        label: 'میز کار',
        icon: CheckSquare,
        href: '/dashboard/tasks',
        matchView: 'tasks',
        matchTasksHome: true,
      },
      {
        id: 'sidebar-calendar',
        label: 'تقویم',
        icon: Calendar,
        href: '/dashboard/tasks?tab=calendar',
        matchView: 'tasks',
        matchTab: 'calendar',
      },
      {
        id: 'chats',
        label: 'گفتگوها',
        icon: MessageSquare,
        href: '/dashboard/chats',
        matchView: 'chats',
      },
      {
        id: 'work-requests',
        label: 'درخواست‌ها',
        icon: ClipboardList,
        href: '/dashboard/work-requests',
        matchView: 'work-requests',
      },
      {
        id: 'sidebar-letters',
        label: 'نامه‌ها',
        icon: Mail,
        href: '/dashboard/tasks?tab=letters',
        matchView: 'tasks',
        matchTab: 'letters',
      },
      {
        id: 'sidebar-phone',
        label: 'دفتر تلفن',
        icon: Phone,
        href: '/dashboard/tasks?tab=phone',
        matchView: 'tasks',
        matchTab: 'phone',
      },
    ],
  },
  {
    id: 'sales-module',
    title: 'فروش',
    defaultExpanded: false,
    collapsible: true,
    items: [
      { id: 'crm', label: 'مدیریت مشتریان (CRM)', icon: Target },
      { id: 'people', label: 'اشخاص', icon: Users },
    ],
  },
  {
    id: 'production-module',
    title: 'تولید',
    defaultExpanded: false,
    collapsible: true,
    items: [
      { id: 'production', label: 'تولید', icon: Factory },
      { id: 'orders', label: 'سفارشات', icon: ShoppingCart },
      { id: 'warehouse', label: 'مدیریت انبار', icon: Warehouse },
      { id: 'requests', label: 'تدارکات و ملزومات', icon: Truck },
    ],
  },
  {
    id: 'commerce',
    title: 'بازرگانی',
    defaultExpanded: false,
    collapsible: true,
    items: [
      { id: 'products', label: 'کالاها و خدمات', icon: Package },
      { id: 'sales', label: 'فروش و درآمد', icon: TrendingUp },
      { id: 'purchasing', label: 'خرید و هزینه', icon: ShoppingBag },
      { id: 'store-admin', label: 'مدیریت فروشگاه', icon: Store },
      { id: 'blog-admin', label: 'مدیریت بلاگ', icon: PenTool },
    ],
  },
  {
    id: 'org',
    title: 'سازمان',
    defaultExpanded: false,
    collapsible: true,
    items: [
      { id: 'hr', label: 'منابع انسانی (HR)', icon: UserCircle },
      { id: 'marketing', label: 'مارکتینگ', icon: Megaphone },
      { id: 'sales-network', label: 'شبکه فروش', icon: Network },
      { id: 'after-sales', label: 'خدمات پس از فروش', icon: LifeBuoy },
    ],
  },
  {
    id: 'finance',
    title: 'مالی',
    defaultExpanded: false,
    collapsible: true,
    items: [
      { id: 'banking', label: 'بانکداری', icon: Wallet },
      { id: 'accounting', label: 'حسابداری', icon: BookOpen },
    ],
  },
  {
    id: 'system',
    title: 'سیستم',
    defaultExpanded: false,
    collapsible: true,
    items: [
      { id: 'reports', label: 'گزارشات و تحلیل‌ها', icon: BarChart3 },
      { id: 'inquiries', label: 'استعلام‌ها', icon: Search },
      { id: 'automation', label: 'اتومیشن', icon: Zap },
      { id: 'workflows', label: 'گردشکارها', icon: GitBranch },
      { id: 'settings', label: 'تنظیمات', icon: Settings },
    ],
  },
];

function viewForMenuItem(item: MenuItem): ViewType | null {
  if (item.matchView) return item.matchView;
  const id = item.id;
  if (
    id === 'sidebar-calendar' ||
    id === 'sidebar-letters' ||
    id === 'sidebar-phone'
  ) {
    return null;
  }
  return id as ViewType;
}

function findGroupIdForView(view: ViewType): string | null {
  for (const group of menuGroups) {
    if (
      group.items.some((item) => {
        const v = viewForMenuItem(item);
        return v === view || item.id === view;
      })
    ) {
      return group.id;
    }
  }
  return null;
}

function loadExpandedGroups(): Record<string, boolean> {
  const initial: Record<string, boolean> = {};
  for (const g of menuGroups) {
    if (g.collapsible) initial[g.id] = g.defaultExpanded;
  }
  if (typeof window === 'undefined') return initial;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_GROUPS_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return { ...initial, ...parsed };
  } catch {
    return initial;
  }
}

type MobileNavItem = {
  label: string;
  icon: React.ElementType;
  href: string;
  matchView?: ViewType;
  matchTab?: string;
  matchTasksHome?: boolean;
};

const mobilePrimaryNav: MobileNavItem[] = [
  {
    label: 'میز کار',
    icon: CheckSquare,
    href: '/dashboard/tasks',
    matchView: 'tasks',
    matchTasksHome: true,
  },
  { label: 'گفتگو', icon: MessageSquare, href: '/dashboard/chats', matchView: 'chats' },
  {
    label: 'نامه',
    icon: Mail,
    href: '/dashboard/tasks?tab=letters',
    matchView: 'tasks',
    matchTab: 'letters',
  },
  {
    label: 'درخواست',
    icon: ClipboardList,
    href: '/dashboard/work-requests',
    matchView: 'work-requests',
  },
  {
    label: 'گزارش',
    icon: BarChart3,
    href: '/dashboard/tasks?tab=reports&section=visits',
    matchView: 'tasks',
    matchTab: 'reports',
  },
];

function isMobileNavActive(
  item: MobileNavItem,
  pathname: string,
  tabParam: string | null,
  currentView: ViewType
): boolean {
  const basePath = item.href.split('?')[0];
  if (pathname !== basePath) return false;
  if (item.matchTab) {
    return tabParam === item.matchTab;
  }
  if (item.matchTasksHome) {
    return currentView === 'tasks' && !tabParam;
  }
  if (item.matchView) {
    return currentView === item.matchView;
  }
  return true;
}

export default function Sidebar({ currentView, onViewChange, isMobileOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(loadExpandedGroups);
  const desktopScrollRef = useRef<HTMLElement | null>(null);
  const mobileScrollRef = useRef<HTMLElement | null>(null);

  const isMenuItemActive = useCallback(
    (item: MenuItem): boolean => {
      if (item.matchTab) {
        const path = item.matchPath ?? item.href?.split('?')[0] ?? '/dashboard/tasks';
        return pathname === path && tabParam === item.matchTab;
      }
      if (item.matchTasksHome) {
        return pathname === '/dashboard/tasks' && currentView === 'tasks' && !tabParam;
      }
      if (item.matchView) {
        if (item.href?.includes('?')) {
          const base = item.href.split('?')[0];
          return pathname === base && currentView === item.matchView && !item.matchTab;
        }
        return currentView === item.matchView;
      }
      return currentView === item.id;
    },
    [pathname, tabParam, currentView]
  );

  const persistExpanded = useCallback((next: Record<string, boolean>) => {
    const collapsibleOnly: Record<string, boolean> = {};
    for (const g of menuGroups) {
      if (g.collapsible && g.id in next) collapsibleOnly[g.id] = next[g.id];
    }
    window.localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(collapsibleOnly));
  }, []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      persistExpanded(next);
      return next;
    });
  };

  const isGroupExpanded = (group: MenuGroup) => {
    if (!group.collapsible) return true;
    return expandedGroups[group.id] ?? group.defaultExpanded;
  };

  useEffect(() => {
    const groupId = findGroupIdForView(currentView);
    if (!groupId || groupId === QUICK_GROUP_ID) return;
    setExpandedGroups((prev) => {
      if (prev[groupId]) return prev;
      const next = { ...prev, [groupId]: true };
      persistExpanded(next);
      return next;
    });
  }, [currentView, persistExpanded]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
    if (!saved) return;
    const top = Number(saved) || 0;
    if (desktopScrollRef.current) desktopScrollRef.current.scrollTop = top;
    if (mobileScrollRef.current) mobileScrollRef.current.scrollTop = top;
  }, [currentView, isMobileOpen]);

  const handleScrollSave = (ev: React.UIEvent<HTMLElement>) => {
    window.sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(ev.currentTarget.scrollTop));
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.href) {
      router.push(item.href);
    } else {
      onViewChange(item.id as ViewType);
    }
    onClose?.();
  };

  const showLabels = !isCollapsed || isMobileOpen;

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const active = isMenuItemActive(item);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleMenuClick(item)}
        className={cn(
          'w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative',
          isChild ? 'py-2 px-3 text-[11px]' : 'py-2.5 px-3 text-xs',
          isChild && showLabels ? 'pr-10' : '',
          active
            ? 'bg-nexa-accent text-white shadow-lg shadow-nexa-accent/20'
            : 'hover:bg-white/5 text-white/60 hover:text-white'
        )}
      >
        <item.icon
          size={isChild ? 18 : 20}
          className={cn(
            'shrink-0 transition-transform duration-200 group-hover:scale-110',
            active ? 'text-white' : 'text-white/40 group-hover:text-white'
          )}
        />
        {showLabels && <span className="font-medium whitespace-nowrap">{item.label}</span>}
      </button>
    );
  };

  const renderGroup = (group: MenuGroup) => {
    const expanded = isGroupExpanded(group);

    if (isCollapsed && !isMobileOpen) {
      return (
        <motion.div key={group.id} className="space-y-1">
          {group.items.map((item) => renderMenuItem(item))}
        </motion.div>
      );
    }

    return (
      <motion.div key={group.id} className="space-y-1">
        {group.collapsible ? (
          <button
            type="button"
            onClick={() => toggleGroup(group.id)}
            className="w-full flex items-center justify-between px-4 py-1.5 mb-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <h3 className="text-[10px] font-bold text-white/40 tracking-wide">{group.title}</h3>
            <ChevronDown
              size={14}
              className={cn(
                'text-white/30 transition-transform duration-200 shrink-0',
                expanded && 'rotate-180'
              )}
            />
          </button>
        ) : (
          <h3 className="px-4 text-[10px] font-bold text-white/40 tracking-wide mb-2">{group.title}</h3>
        )}

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden space-y-0.5"
            >
              {group.items.map((item) => renderMenuItem(item, group.collapsible))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderSidebarContent = (isMobile?: boolean) => (
    <>
      <motion.div layout className="p-6 flex items-center justify-between border-b border-white/10 shrink-0">
        <Logo light showText={showLabels} />
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white hidden md:block"
        >
          {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white md:hidden"
        >
          <X size={24} />
        </button>
      </motion.div>

      <nav
        ref={(el) => {
          if (isMobile) mobileScrollRef.current = el;
          else desktopScrollRef.current = el;
        }}
        onScroll={handleScrollSave}
        className="flex-1 py-4 px-3 space-y-4 overflow-y-auto custom-scrollbar"
      >
        {menuGroups.map((group) => renderGroup(group))}
      </nav>

      <motion.div layout className="p-4 border-t border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors group"
        >
          <LogOut size={20} className="shrink-0" />
          {showLabels && <span className="font-medium text-xs">خروج از سیستم</span>}
        </button>
      </motion.div>
    </>
  );

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-72 bg-nexa-primary text-white z-[70] flex flex-col md:hidden shadow-2xl"
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed top-0 right-0 h-full bg-nexa-primary text-white transition-all duration-300 z-50 hidden md:flex flex-col border-l border-white/5',
          isCollapsed ? 'w-20' : 'w-72'
        )}
      >
        {renderSidebarContent(false)}
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 bg-nexa-primary text-white h-16 flex items-center justify-around px-1 z-[100] md:hidden border-t border-white/10">
        {mobilePrimaryNav.map((item) => {
          const active = isMobileNavActive(item, pathname, tabParam, currentView);
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => {
                router.push(item.href);
                onClose?.();
              }}
              className={cn(
                'p-1.5 rounded-xl transition-all flex flex-col items-center gap-0.5 min-w-0 flex-1 max-w-[72px]',
                active ? 'bg-nexa-accent text-white' : 'text-white/40'
              )}
              aria-label={item.label}
            >
              <item.icon size={20} />
              <span className="text-[8px] font-bold truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
