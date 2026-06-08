'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/src/layouts/DashboardShell';
import { dashboardViews } from '@/src/dashboard/view-map';
import type { ViewType } from '@/src/types';
import Settings from '@/src/views/Settings';

interface DashboardViewPageProps {
  params: Promise<{ view: string }>;
}

export default function DashboardViewPage({ params }: DashboardViewPageProps) {
  const router = useRouter();
  const resolved = use(params);
  const legacyUsers = resolved.view === 'users';
  const safeView = (
    legacyUsers
      ? 'settings'
      : resolved.view in dashboardViews
        ? resolved.view
        : 'dashboard'
  ) as ViewType;
  const ViewComponent = dashboardViews[safeView];

  return (
    <DashboardShell
      currentView={safeView}
      onViewChange={(view) => router.push(`/dashboard/${view}`)}
    >
      {legacyUsers ? <Settings initialSection="access" /> : <ViewComponent />}
    </DashboardShell>
  );
}
