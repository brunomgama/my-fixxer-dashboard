'use client';

import { useEnvironment } from '@/lib/context/environment';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function EnvironmentDropdown() {
  const { env, setEnv } = useEnvironment();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="capitalize">{env}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {['local', 'dev', 'staging', 'prod'].map((envKey) => (
          <DropdownMenuItem key={envKey} onClick={() => setEnv(envKey as any)}>
            {envKey}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}