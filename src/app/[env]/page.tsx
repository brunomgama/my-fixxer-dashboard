'use client';

import { DashboardShell } from '@/components/dashboard-shell';
import { EnvironmentProvider } from '@/lib/context/environment';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <EnvironmentProvider>
      <DashboardShell>
        <div className="flex flex-col items-start gap-4">
          <Button onClick={() => router.push('/dev/emails/audience')}>Emails</Button>
          <Button onClick={() => router.push('/dev/workflows')}>Workflows</Button>
        </div>
      </DashboardShell>
    </EnvironmentProvider>
  );
}
