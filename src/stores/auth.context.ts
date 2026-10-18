'use client';
import { createContext, useContext } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAppStore } from './app.store';
import type { Employee } from '@/types';

interface AuthValue {
  authEmail: string;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuthEmail(): string {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthEmail called outside <ClientProviders>');
  return ctx.authEmail;
}

/**
 * Resolve the signed-in employee by matching the auth email against the
 * current roster held in the app store. Throws if there's no match so a bug
 * is obvious instead of silently null.
 */
export function useCurrentEmployee(): Employee {
  const email = useAuthEmail();
  const employees = useAppStore((s) => s.state.employees);
  const emp = employees.find((e) => e.email.toLowerCase() === email.toLowerCase());
  if (!emp) throw new Error(`No employee record for authenticated user ${email}`);
  return emp;
}

/**
 * Sign out of Supabase and bounce to /login. Standalone function — call from
 * any event handler, no hook required.
 */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') window.location.href = '/login';
}
