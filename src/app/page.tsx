'use client';

import { DashboardShell } from '@/components/dashboard-shell';
import { EnvironmentProvider, useEnvironment } from '@/lib/context/environment';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <EnvironmentProvider>
      <DashboardShell>
        <>
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
              <p className="text-muted-foreground">Select your environment to get started.</p>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => router.push('/select-environment')}>
                Select Environment
              </Button>
            </div>
          </div>
        </>
      </DashboardShell>
    </EnvironmentProvider>
  );
}
