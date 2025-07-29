import { SessionNavBar } from './sidebar';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-row">
      <SessionNavBar />
      <main className="flex h-screen grow flex-col overflow-auto ml-4 mt-4 mr-4 mb-4">
      {children}
      </main>
    </div>
  );
}
