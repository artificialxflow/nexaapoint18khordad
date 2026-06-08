'use client';

import { Suspense } from 'react';
import MeizitoWorkspace from './meizito/MeizitoWorkspace';

function TasksFallback() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-12 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="nexa-card p-8 min-h-[520px] bg-gray-50 animate-pulse rounded-2xl" />
    </div>
  );
}

export default function Tasks() {
  return (
    <Suspense fallback={<TasksFallback />}>
      <MeizitoWorkspace />
    </Suspense>
  );
}
