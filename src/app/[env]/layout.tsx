import { EnvironmentProvider } from '@/lib/context/environment';
import '@/app/globals.css';
import { DashboardShell } from '@/components/dashboard-shell';

export default function EnvironmentLayout({ children }: { children: React.ReactNode }) {
    return (
      <EnvironmentProvider>
        <DashboardShell>{children}</DashboardShell>
      </EnvironmentProvider>
    );
  }