'use client';
import { create } from 'zustand';
import type { Employee } from '@/types';
import { createClient } from '@/utils/supabase/client';

interface AuthState {
  initialized: boolean;
  authEmail: string | null;
  currentEmployee: Employee | null;
  setBootstrap: (payload: { authEmail: string | null; currentEmployee: Employee | null }) => void;
  setCurrentEmployee: (emp: Employee | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  initialized: false,
  authEmail: null,
  currentEmployee: null,
  setBootstrap({ authEmail, currentEmployee }) {
    set({ initialized: true, authEmail, currentEmployee });
  },
  setCurrentEmployee(emp) {
    set({ currentEmployee: emp });
  },
  async signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ authEmail: null, currentEmployee: null });
    if (typeof window !== 'undefined') window.location.href = '/login';
  },
}));
