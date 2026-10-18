'use client';
import { useRef, type ReactNode } from 'react';
import type { AppState } from '@/services/storage.service';
import type { Employee } from '@/types';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';

interface Props {
  initialState: AppState;
  authEmail: string | null;
  currentEmployee: Employee | null;
  children: ReactNode;
}

export function AppStoreHydrator({ initialState, authEmail, currentEmployee, children }: Props) {
  const hydrated = useRef(false);
  if (!hydrated.current) {
    useAppStore.getState().hydrate(initialState);
    useAuthStore.getState().setBootstrap({ authEmail, currentEmployee });
    hydrated.current = true;
  }
  return <>{children}</>;
}
