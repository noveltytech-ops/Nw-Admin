'use client';
import { createContext, useContext } from 'react';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { http } from '@/lib/axios';
import type { AppState } from '@/services/storage.service';
import type { LeaveApplicationInput } from '@/services/leave.service';
import type { WFHApplicationInput } from '@/services/wfh.service';
import type { Employee, Holiday, LeavePolicy, LeaveTypeConfig, WorkPolicy } from '@/types';

export interface ToastMsg {
  id: number;
  tone: 'success' | 'error' | 'info';
  message: string;
}

export interface AppStore {
  state: AppState;
  busy: boolean;
  toasts: ToastMsg[];
  _toastSeq: number;

  hydrate: (state: AppState) => void;

  pushToast: (toast: Omit<ToastMsg, 'id'>) => void;
  dismissToast: (id: number) => void;

  refresh: () => Promise<void>;

  // Leave
  submitLeave: (input: LeaveApplicationInput) => Promise<AppState>;
  approveLeave: (id: string, approverId: string, comment?: string) => Promise<AppState>;
  rejectLeave: (id: string, approverId: string, comment?: string) => Promise<AppState>;
  withdrawLeave: (id: string, actorId: string) => Promise<AppState>;
  cancelLeave: (id: string, actorId: string, note?: string) => Promise<AppState>;

  // WFH
  submitWFH: (input: WFHApplicationInput) => Promise<AppState>;
  approveWFH: (id: string, approverId: string, comment?: string) => Promise<AppState>;
  rejectWFH: (id: string, approverId: string, comment?: string) => Promise<AppState>;
  withdrawWFH: (id: string, actorId: string) => Promise<AppState>;

  // Holidays
  addHoliday: (actorId: string, holiday: Omit<Holiday, 'id'>) => Promise<AppState>;
  updateHoliday: (actorId: string, id: string, patch: Partial<Omit<Holiday, 'id'>>) => Promise<AppState>;
  removeHoliday: (actorId: string, id: string) => Promise<AppState>;

  // Employees
  createEmployee: (actorId: string, input: Omit<Employee, 'id' | 'balances'>) => Promise<AppState>;
  updateEmployee: (actorId: string, id: string, patch: Partial<Omit<Employee, 'id'>>) => Promise<AppState>;
  deactivateEmployee: (actorId: string, id: string) => Promise<AppState>;
  setManager: (actorId: string, id: string, managerId: string | null) => Promise<AppState>;

  // Policies
  updatePolicy: (actorId: string, patch: Partial<WorkPolicy>) => Promise<AppState>;
  updateLeavePolicy: (patch: Partial<LeavePolicy>) => Promise<AppState>;
  updateLeaveType: (id: string, patch: Partial<LeaveTypeConfig>) => Promise<AppState>;
  applyLeaveTypeToAll: (id: string, allocated: number) => Promise<AppState>;

  resetState: () => Promise<AppState>;
}

async function postState(url: string, body?: unknown): Promise<AppState> {
  const { data } = await http.post<AppState>(url, body ?? {});
  return data;
}
async function patchState(url: string, body?: unknown): Promise<AppState> {
  const { data } = await http.patch<AppState>(url, body ?? {});
  return data;
}
async function deleteState(url: string, body?: unknown): Promise<AppState> {
  const { data } = await http.delete<AppState>(url, { data: body });
  return data;
}

export function createAppStore(initialState: AppState): StoreApi<AppStore> {
  return createStore<AppStore>((set, get) => {
    const call = async (fn: () => Promise<AppState>): Promise<AppState> => {
      set({ busy: true });
      try {
        const next = await fn();
        set({ state: next, busy: false });
        return next;
      } catch (err) {
        set({ busy: false });
        const message = err instanceof Error ? err.message : 'Request failed';
        get().pushToast({ tone: 'error', message });
        throw err;
      }
    };

    return {
      state: initialState,
      busy: false,
      toasts: [],
      _toastSeq: 0,

      hydrate(state) {
        set({ state });
      },

      pushToast(t) {
        const id = get()._toastSeq + 1;
        set({ _toastSeq: id, toasts: [...get().toasts, { id, ...t }] });
        setTimeout(() => {
          set({ toasts: get().toasts.filter((p) => p.id !== id) });
        }, 3500);
      },
      dismissToast(id) {
        set({ toasts: get().toasts.filter((t) => t.id !== id) });
      },

      async refresh() {
        const { data } = await http.get<AppState>('/api/state');
        set({ state: data });
      },

      submitLeave: (input) => call(() => postState('/api/leave', input)),
      approveLeave: (id, approverId, comment) =>
        call(() => postState(`/api/leave/${id}/approve`, { approverId, comment })),
      rejectLeave: (id, approverId, comment) =>
        call(() => postState(`/api/leave/${id}/reject`, { approverId, comment })),
      withdrawLeave: (id, actorId) =>
        call(() => postState(`/api/leave/${id}/withdraw`, { actorId })),
      cancelLeave: (id, actorId, note) =>
        call(() => postState(`/api/leave/${id}/cancel`, { actorId, note })),

      submitWFH: (input) => call(() => postState('/api/wfh', input)),
      approveWFH: (id, approverId, comment) =>
        call(() => postState(`/api/wfh/${id}/approve`, { approverId, comment })),
      rejectWFH: (id, approverId, comment) =>
        call(() => postState(`/api/wfh/${id}/reject`, { approverId, comment })),
      withdrawWFH: (id, actorId) =>
        call(() => postState(`/api/wfh/${id}/withdraw`, { actorId })),

      addHoliday: (actorId, holiday) =>
        call(() => postState('/api/holidays', { actorId, holiday })),
      updateHoliday: (actorId, id, patch) =>
        call(() => patchState(`/api/holidays/${id}`, { actorId, patch })),
      removeHoliday: (actorId, id) =>
        call(() => deleteState(`/api/holidays/${id}`, { actorId })),

      createEmployee: (actorId, input) =>
        call(() => postState('/api/employees', { actorId, input })),
      updateEmployee: (actorId, id, patch) =>
        call(() => patchState(`/api/employees/${id}`, { actorId, patch })),
      deactivateEmployee: (actorId, id) =>
        call(() => deleteState(`/api/employees/${id}`, { actorId })),
      setManager: (actorId, id, managerId) =>
        call(() => patchState(`/api/employees/${id}/manager`, { actorId, managerId })),

      updatePolicy: (actorId, patch) =>
        call(() => patchState('/api/policy', { actorId, patch })),
      updateLeavePolicy: (patch) => call(() => patchState('/api/leave-policy', { patch })),
      updateLeaveType: (id, patch) => call(() => patchState(`/api/leave-types/${id}`, { patch })),
      applyLeaveTypeToAll: (id, allocated) =>
        call(() => postState(`/api/leave-types/${id}/apply-to-all`, { allocated })),

      resetState: () => call(() => postState('/api/reset')),
    };
  });
}

export type AppStoreApi = StoreApi<AppStore>;

export const AppStoreContext = createContext<AppStoreApi | null>(null);

/**
 * Context-aware Zustand hook. The store is created per-request by
 * ClientProviders — this prevents the module-level singleton from leaking
 * state between concurrent SSR requests.
 */
export function useAppStore<T>(selector: (s: AppStore) => T): T {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error('useAppStore called outside <ClientProviders>');
  return useStore(store, selector);
}
