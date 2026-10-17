import type { AppState } from './storage.service';
import type { LeaveApplicationInput } from './leave.service';
import type { WFHApplicationInput } from './wfh.service';
import type { Employee, Holiday, LeavePolicy, LeaveTypeConfig, WorkPolicy } from '@/types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${init?.method ?? 'GET'} ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export const apiClient = {
  getState: () => request<AppState>('/api/state'),

  // Leave
  submitLeave: (input: LeaveApplicationInput) =>
    request<AppState>('/api/leave', { method: 'POST', body: JSON.stringify(input) }),
  approveLeave: (id: string, approverId: string, comment?: string) =>
    request<AppState>(`/api/leave/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approverId, comment }),
    }),
  rejectLeave: (id: string, approverId: string, comment?: string) =>
    request<AppState>(`/api/leave/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ approverId, comment }),
    }),
  withdrawLeave: (id: string, actorId: string) =>
    request<AppState>(`/api/leave/${id}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ actorId }),
    }),
  cancelLeave: (id: string, actorId: string, note?: string) =>
    request<AppState>(`/api/leave/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ actorId, note }),
    }),

  // WFH
  submitWFH: (input: WFHApplicationInput) =>
    request<AppState>('/api/wfh', { method: 'POST', body: JSON.stringify(input) }),
  approveWFH: (id: string, approverId: string, comment?: string) =>
    request<AppState>(`/api/wfh/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approverId, comment }),
    }),
  rejectWFH: (id: string, approverId: string, comment?: string) =>
    request<AppState>(`/api/wfh/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ approverId, comment }),
    }),
  withdrawWFH: (id: string, actorId: string) =>
    request<AppState>(`/api/wfh/${id}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ actorId }),
    }),

  // Holidays
  addHoliday: (actorId: string, holiday: Omit<Holiday, 'id'>) =>
    request<AppState>('/api/holidays', { method: 'POST', body: JSON.stringify({ actorId, holiday }) }),
  updateHoliday: (actorId: string, id: string, patch: Partial<Omit<Holiday, 'id'>>) =>
    request<AppState>(`/api/holidays/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ actorId, patch }),
    }),
  removeHoliday: (actorId: string, id: string) =>
    request<AppState>(`/api/holidays/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ actorId }),
    }),

  // Employees
  createEmployee: (actorId: string, input: Omit<Employee, 'id' | 'balances'>) =>
    request<AppState>('/api/employees', { method: 'POST', body: JSON.stringify({ actorId, input }) }),
  updateEmployee: (actorId: string, id: string, patch: Partial<Omit<Employee, 'id'>>) =>
    request<AppState>(`/api/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ actorId, patch }),
    }),
  deactivateEmployee: (actorId: string, id: string) =>
    request<AppState>(`/api/employees/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ actorId }),
    }),
  setManager: (actorId: string, id: string, managerId: string | null) =>
    request<AppState>(`/api/employees/${id}/manager`, {
      method: 'PATCH',
      body: JSON.stringify({ actorId, managerId }),
    }),

  // Policies
  updatePolicy: (actorId: string, patch: Partial<WorkPolicy>) =>
    request<AppState>('/api/policy', { method: 'PATCH', body: JSON.stringify({ actorId, patch }) }),
  updateLeavePolicy: (patch: Partial<LeavePolicy>) =>
    request<AppState>('/api/leave-policy', { method: 'PATCH', body: JSON.stringify({ patch }) }),
  updateLeaveType: (id: string, patch: Partial<LeaveTypeConfig>) =>
    request<AppState>(`/api/leave-types/${id}`, { method: 'PATCH', body: JSON.stringify({ patch }) }),
  applyLeaveTypeToAll: (id: string, allocated: number) =>
    request<AppState>(`/api/leave-types/${id}/apply-to-all`, {
      method: 'POST',
      body: JSON.stringify({ allocated }),
    }),

  // Admin
  resetState: () => request<AppState>('/api/reset', { method: 'POST' }),
};

export type ApiClient = typeof apiClient;
