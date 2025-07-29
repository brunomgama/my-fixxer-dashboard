'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ENV_CONFIG, EnvKey } from '@/lib/env-config';

type EnvironmentContextType = {
  env: EnvKey;
  apiBaseUrl: string;
  setEnv: (env: EnvKey) => void;
};

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const EnvironmentProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [env, setEnvState] = useState<EnvKey>('local');

  useEffect(() => {
    const pathEnv = pathname?.split('/')[1] as EnvKey;
    if (pathEnv && ENV_CONFIG[pathEnv]) setEnvState(pathEnv);
  }, [pathname]);

  const setEnv = (newEnv: EnvKey) => {
    const parts = pathname?.split('/') ?? [];
    parts[1] = newEnv;
    router.push(parts.join('/'));
    setEnvState(newEnv);
  };

  return (
    <EnvironmentContext.Provider value={{ env, apiBaseUrl: ENV_CONFIG[env].apiBaseUrl, setEnv }}>
      {children}
    </EnvironmentContext.Provider>
  );
};

export const useEnvironment = () => {
  const ctx = useContext(EnvironmentContext);
  if (!ctx) throw new Error('useEnvironment must be used inside EnvironmentProvider');
  return ctx;
};
