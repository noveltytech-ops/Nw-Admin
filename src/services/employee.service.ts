import type { Employee, LeaveBalance, LeaveTypeConfig } from '@/types';
import type { AppState } from './storage.service';

export const employeeService = {
  byId(state: AppState, id: string): Employee | undefined {
    return state.employees.find((e) => e.id === id);
  },
  active(state: AppState): Employee[] {
    return state.employees.filter((e) => e.active);
  },
  reports(state: AppState, managerId: string): Employee[] {
    return state.employees.filter((e) => e.managerId === managerId);
  },
  managers(state: AppState): Employee[] {
    return state.employees.filter(
      (e) => e.active && (e.role === 'lead' || e.role === 'manager' || e.role === 'admin'),
    );
  },
  team(state: AppState, employeeId: string): Employee[] {
    const emp = this.byId(state, employeeId);
    if (!emp) return [];
    if (!emp.managerId) return this.reports(state, emp.id);
    return state.employees.filter(
      (e) => e.active && e.managerId === emp.managerId && e.id !== emp.id,
    );
  },
  defaultBalance(leaveTypes: LeaveTypeConfig[]): LeaveBalance[] {
    return leaveTypes.map((lt) => ({
      leaveTypeId: lt.id,
      allocated: lt.defaultAnnualQuota,
      used: 0,
    }));
  },
  wouldCreateCycle(state: AppState, employeeId: string, newManagerId: string | null): boolean {
    if (!newManagerId) return false;
    if (newManagerId === employeeId) return true;
    let cursor: string | null = newManagerId;
    const seen = new Set<string>();
    while (cursor) {
      if (seen.has(cursor)) return true;
      if (cursor === employeeId) return true;
      seen.add(cursor);
      const next = state.employees.find((e) => e.id === cursor);
      cursor = next?.managerId ?? null;
    }
    return false;
  },
};
