import type {
  AuditEvent,
  Employee,
  Holiday,
  LeavePolicy,
  LeaveRequest,
  LeaveTypeConfig,
  Role,
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

export const DEMO_PERSONAS: { id: string; role: Role }[] = [
  { id: 'emp_tharun', role: 'employee' },
  { id: 'emp_sajal', role: 'manager' },
  { id: 'emp_admin', role: 'admin' },
];
