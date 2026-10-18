'use client';
import { create } from 'zustand';
import { http } from '@/lib/axios';
import type { AppState } from '@/services/storage.service';
import type { LeaveApplicationInput } from '@/services/leave.service';
import type { WFHApplicationInput } from '@/services/wfh.service';
import type { Employee, Holiday, LeavePolicy, LeaveTypeConfig, WorkPolicy } from '@/types';
import { useAuthStore } from './auth.store';

export interface ToastMsg {
  id: number;
  tone: 'success' | 'error' | 'info';
  message: string;
}

interface AppStore {
  state: AppState;
  busy: boolean;
  toasts: ToastMsg[];
  _toastSeq: number;

  // Hydration
  hydrate: (state: AppState) => void;

  // Toasts
  pushToast: (toast: Omit<ToastMsg, 'id'>) => void;
  dismissToast: (id: number) => void;

  // Reads
  refresh: () => Promise<void>;

  // Leave mutations
  submitLeave: (input: LeaveApplicationInput) => Promise<AppState>;
  approveLeave: (id: string, approverId: string, comment?: string) => Promise<AppState>;
  rejectLeave: (id: string, approverId: string, comment?: string) => Promise<AppState>;
  withdrawLeave: (id: string, actorId: string) => Promise<AppState>;
  cancelLeave: (id: string, actorId: string, note?: string) => Promise<AppState>;

  // WFH mutations
  submitWFH: (input: WFHApplicationInput) => Promise<AppState>;
  approveWFH: (id: string, approverId: string, comment?: string) => Promise<AppState>;
  rejectWFH: (id: string, approverId: string, comment?: string) => Promise<AppState>;
  withdrawWFH: (id: string, actorId: string) => Promise<AppState>;

  // Holiday mutations
  addHoliday: (actorId: string, holiday: Omit<Holiday, 'id'>) => Promise<AppState>;
  updateHoliday: (actorId: string, id: string, patch: Partial<Omit<Holiday, 'id'>>) => Promise<AppState>;
  removeHoliday: (actorId: string, id: string) => Promise<AppState>;

  // Employee mutations
  createEmployee: (actorId: string, input: Omit<Employee, 'id' | 'balances'>) => Promise<AppState>;
  updateEmployee: (actorId: string, id: string, patch: Partial<Omit<Employee, 'id'>>) => Promise<AppState>;
  deactivateEmployee: (actorId: string, id: string) => Promise<AppState>;
  setManager: (actorId: string, id: string, managerId: string | null) => Promise<AppState>;

  // Policy mutations
  updatePolicy: (actorId: string, patch: Partial<WorkPolicy>) => Promise<AppState>;
  updateLeavePolicy: (patch: Partial<LeavePolicy>) => Promise<AppState>;
  updateLeaveType: (id: string, patch: Partial<LeaveTypeConfig>) => Promise<AppState>;
  applyLeaveTypeToAll: (id: string, allocated: number) => Promise<AppState>;

  // Admin
  resetState: () => Promise<AppState>;
}

const emptyState: AppState = {
  version: 0,
  employees: [],
  leaveTypes: [],
  leaveRequests: [],
  wfhRequests: [],
  holidays: [],
  policy: {
    workMode: { 0: 'off', 1: 'office', 2: 'wfh', 3: 'office', 4: 'office', 5: 'wfh', 6: 'off' },
    effectiveFrom: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString(),
    updatedBy: '',
  },
  leavePolicy: {
    leaveYearStartMonth: 1,
    maxCarryForward: 5,
    excessCarryForwardTreatment: 'encash-at-basic-pay',
    qEndNegativeAllowance: 3,
    q4NegativeTreatment: 'loss-of-pay',
    halfDayRequiresManagerApproval: true,
    retrospectiveLeaveTreatment: 'loss-of-pay',
  },
  audit: [],
};

async function run<T>(fn: () => Promise<T>, set: (p: Partial<AppStore>) => void, get: () => AppStore): Promise<T> {
  set({ busy: true });
  try {
    const result = await fn();
    set({ busy: false });
    return result;
  } catch (err) {
    set({ busy: false });
    const message = err instanceof Error ? err.message : 'Request failed';
    get().pushToast({ tone: 'error', message });
    throw err;
  }
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

export const useAppStore = create<AppStore>((set, get) => {
  const applyNext = (next: AppState) => {
    set({ state: next });
    // Keep the auth store's current employee in sync when roster changes.
    const authStore = useAuthStore.getState();
    if (authStore.currentEmployee) {
      const refreshed = next.employees.find((e) => e.id === authStore.currentEmployee!.id);
      if (refreshed) authStore.setCurrentEmployee(refreshed);
    }
  };

  const call = async (fn: () => Promise<AppState>): Promise<AppState> => {
    return run(
      async () => {
        const next = await fn();
        applyNext(next);
        return next;
      },
      set,
      get,
    );
  };

  return {
    state: emptyState,
    busy: false,
    toasts: [],
    _toastSeq: 0,

    hydrate(state) {
      applyNext(state);
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
      applyNext(data);
    },

    // Leave
    submitLeave: (input) => call(() => postState('/api/leave', input)),
    approveLeave: (id, approverId, comment) =>
      call(() => postState(`/api/leave/${id}/approve`, { approverId, comment })),
    rejectLeave: (id, approverId, comment) =>
      call(() => postState(`/api/leave/${id}/reject`, { approverId, comment })),
    withdrawLeave: (id, actorId) => call(() => postState(`/api/leave/${id}/withdraw`, { actorId })),
    cancelLeave: (id, actorId, note) =>
      call(() => postState(`/api/leave/${id}/cancel`, { actorId, note })),

    // WFH
    submitWFH: (input) => call(() => postState('/api/wfh', input)),
    approveWFH: (id, approverId, comment) =>
      call(() => postState(`/api/wfh/${id}/approve`, { approverId, comment })),
    rejectWFH: (id, approverId, comment) =>
      call(() => postState(`/api/wfh/${id}/reject`, { approverId, comment })),
    withdrawWFH: (id, actorId) => call(() => postState(`/api/wfh/${id}/withdraw`, { actorId })),

    // Holidays
    addHoliday: (actorId, holiday) => call(() => postState('/api/holidays', { actorId, holiday })),
    updateHoliday: (actorId, id, patch) =>
      call(() => patchState(`/api/holidays/${id}`, { actorId, patch })),
    removeHoliday: (actorId, id) => call(() => deleteState(`/api/holidays/${id}`, { actorId })),

    // Employees
    createEmployee: (actorId, input) => call(() => postState('/api/employees', { actorId, input })),
    updateEmployee: (actorId, id, patch) =>
      call(() => patchState(`/api/employees/${id}`, { actorId, patch })),
    deactivateEmployee: (actorId, id) =>
      call(() => deleteState(`/api/employees/${id}`, { actorId })),
    setManager: (actorId, id, managerId) =>
      call(() => patchState(`/api/employees/${id}/manager`, { actorId, managerId })),

    // Policies
    updatePolicy: (actorId, patch) => call(() => patchState('/api/policy', { actorId, patch })),
    updateLeavePolicy: (patch) => call(() => patchState('/api/leave-policy', { patch })),
    updateLeaveType: (id, patch) => call(() => patchState(`/api/leave-types/${id}`, { patch })),
    applyLeaveTypeToAll: (id, allocated) =>
      call(() => postState(`/api/leave-types/${id}/apply-to-all`, { allocated })),

    // Admin
    resetState: () => call(() => postState('/api/reset')),
  };
});
