'use client';
import { useRef, type ReactNode } from 'react';
import type { AppState } from '@/services/storage.service';
import { AppStoreContext, createAppStore, type AppStoreApi } from '@/stores/app.store';
import { AuthContext } from '@/stores/auth.context';

interface Props {
  initialState: AppState;
  authEmail: string;
  children: ReactNode;
}

export function ClientProviders({ initialState, authEmail, children }: Props) {
  // Per-request store instance so SSR doesn't leak state across concurrent
  // requests. `useRef` ensures the store is created exactly once per mount.
  const storeRef = useRef<AppStoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createAppStore(initialState);
  }

  return (
    <AuthContext.Provider value={{ authEmail }}>
      <AppStoreContext.Provider value={storeRef.current}>{children}</AppStoreContext.Provider>
    </AuthContext.Provider>
  );
}
