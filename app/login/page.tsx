import { Suspense } from 'react';
import LoginPage from './page.client';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <LoginPage />
    </Suspense>
  );
}
