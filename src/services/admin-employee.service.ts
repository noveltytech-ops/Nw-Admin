import type { Employee } from '@/types';
import { genId } from '@/utils/ids';
import { employeeService } from './employee.service';
import type { AppState } from './storage.service';

export const adminEmployeeService = {
  create(state: AppState, actorId: string, input: Omit<Employee, 'id' | 'balances'>): { state: AppState; employee: Employee } {
    const emp: Employee = {
      ...input,
      id: genId('emp'),
      balances: employeeService.defaultBalance(state.leaveTypes),
    };
    const next: AppState = {
      ...state,
      employees: [...state.employees, emp],
      audit: [
        {
          id: genId('aud'),
          entityId: emp.id,
          action: 'employee.created',
          actorId,
          at: new Date().toISOString(),
        },
        ...state.audit,
      ],
    };
    return { state: next, employee: emp };
  },
  update(state: AppState, actorId: string, id: string, patch: Partial<Omit<Employee, 'id'>>): AppState {
    return {
      ...state,
      employees: state.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      audit: [
        {
          id: genId('aud'),
          entityId: id,
          action: 'employee.updated',
          actorId,
          at: new Date().toISOString(),
        },
        ...state.audit,
      ],
    };
  },
  setManager(state: AppState, actorId: string, employeeId: string, newManagerId: string | null): AppState {
    if (employeeService.wouldCreateCycle(state, employeeId, newManagerId)) {
      return state; // reject silently; UI validates before calling
    }
    return this.update(state, actorId, employeeId, { managerId: newManagerId });
  },
  deactivate(state: AppState, actorId: string, id: string): AppState {
    return {
      ...state,
      employees: state.employees.map((e) => (e.id === id ? { ...e, active: false } : e)),
      audit: [
        {
          id: genId('aud'),
          entityId: id,
          action: 'employee.deactivated',
          actorId,
          at: new Date().toISOString(),
        },
        ...state.audit,
      ],
    };
  },
};
