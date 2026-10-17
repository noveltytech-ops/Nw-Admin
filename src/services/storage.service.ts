import type {
  AuditEvent,
  Employee,
  Holiday,
  LeavePolicy,
  LeaveRequest,
  LeaveTypeConfig,
  WFHRequest,
  WorkPolicy,
} from '@/types';

const PERSONA_KEY = 'nw-admin::persona::v1';
export const DATA_VERSION = 5;

export interface AppState {
  version: number;
  employees: Employee[];
  leaveTypes: LeaveTypeConfig[];
  leaveRequests: LeaveRequest[];
  wfhRequests: WFHRequest[];
  holidays: Holiday[];
  policy: WorkPolicy;
  leavePolicy: LeavePolicy;
  audit: AuditEvent[];
}

export const personaStorage = {
  load(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(PERSONA_KEY);
  },
  save(employeeId: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PERSONA_KEY, employeeId);
  },
};

/**
 * Pick a sensible default persona from whatever employees are loaded.
 * Preference: previously-selected (if still active) → first active employee →
 * first active manager → first active admin → first employee → undefined.
 */
export function pickDefaultPersonaId(employees: Employee[]): string | undefined {
  const stored = personaStorage.load();
  if (stored && employees.some((e) => e.id === stored && e.active)) return stored;
  const roles: Array<Employee['role']> = ['employee', 'manager', 'admin'];
  for (const role of roles) {
    const match = employees.find((e) => e.active && e.role === role);
    if (match) return match.id;
  }
  return employees[0]?.id;
}
