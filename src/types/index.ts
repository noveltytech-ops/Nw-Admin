export type Role = 'employee' | 'manager' | 'admin';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface LeaveTypeConfig {
  id: string;
  code: string; // e.g. "PL"
  name: string; // e.g. "Paid Leave"
  color: string; // tailwind-ready hex for events
  defaultAnnualQuota: number;
  allowHalfDay: boolean;
  allowNegativeBalance: boolean;
  // Maximum negative balance tolerated at validation time (0 if negative not allowed).
  maxNegativeBalance: number;
  // Accrual cadence used to compute how much of the annual quota is "earned" at a given date.
  accrual: 'yearly' | 'quarterly';
  description?: string;
}

export interface LeaveBalance {
  leaveTypeId: string;
  allocated: number;
  used: number;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  managerId: string | null;
  joiningDate: string; // ISO date
  active: boolean;
  role: Role;
  avatarColor: string;
  balances: LeaveBalance[];
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'withdrawn';

export type HalfDayPeriod = 'first' | 'second';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  halfDay: HalfDayPeriod | null; // non-null => single-day half day
  workingDays: number;
  reason: string;
  status: RequestStatus;
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  reviewerComment?: string;
}

export interface WFHRequest {
  id: string;
  employeeId: string;
  date: string; // ISO date (single day)
  reason: string;
  status: RequestStatus;
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  reviewerComment?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // ISO date
  description?: string;
}

export interface WorkPolicy {
  // workMode[weekday] -> 'office' | 'wfh'. 0 = Sunday ... 6 = Saturday.
  workMode: Record<Weekday, 'office' | 'wfh' | 'off'>;
  effectiveFrom: string;
  updatedAt: string;
  updatedBy: string;
}

export type AuditAction =
  | 'leave.submitted'
  | 'leave.approved'
  | 'leave.rejected'
  | 'leave.withdrawn'
  | 'leave.cancelled'
  | 'wfh.submitted'
  | 'wfh.approved'
  | 'wfh.rejected'
  | 'wfh.withdrawn'
  | 'policy.updated'
  | 'holiday.added'
  | 'holiday.updated'
  | 'holiday.deleted'
  | 'employee.updated'
  | 'employee.created'
  | 'employee.deactivated';

export interface AuditEvent {
  id: string;
  entityId: string; // request id or employee id or policy
  action: AuditAction;
  actorId: string;
  at: string;
  note?: string;
}

export interface AppStateVersion {
  version: number;
}

export interface LeavePolicy {
  leaveYearStartMonth: 1; // January
  maxCarryForward: number;
  excessCarryForwardTreatment: 'encash-at-basic-pay' | 'lapse';
  qEndNegativeAllowance: number; // negative balance tolerated at end of Q1–Q3
  q4NegativeTreatment: 'loss-of-pay' | 'carry';
  halfDayRequiresManagerApproval: boolean;
  retrospectiveLeaveTreatment: 'loss-of-pay' | 'allow';
}
