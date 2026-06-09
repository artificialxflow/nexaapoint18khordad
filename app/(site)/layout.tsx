import { AppProviders } from '../providers';

export const dynamic = 'force-dynamic';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
