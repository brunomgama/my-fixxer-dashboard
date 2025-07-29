'use client';

import { EnvironmentDropdown } from './environment-dropdown';

export function Header() {
  return (
    <header className="h-16 px-6 flex items-center border-b justify-end">
      <EnvironmentDropdown />
    </header>
  );
}