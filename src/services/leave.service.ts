import type { Employee, LeaveRequest, LeaveTypeConfig } from '@/types';
import { datesBetween, parseISODate, quartersAccruedBy, toISO, todayISO } from '@/utils/date';
import { genId } from '@/utils/ids';
import type { AppState } from './storage.service';
import { computeWorkingDays } from './working-days.service';

export interface LeaveApplicationInput {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  halfDay: 'first' | 'second' | null;
  reason: string;
}

export interface ValidationIssue {
  field?: keyof LeaveApplicationInput | 'overlap' | 'balance' | 'window';
  message: string;
  severity: 'error' | 'warning';
}

export const leaveService = {
  getBalance(emp: Employee, leaveTypeId: string): { allocated: number; used: number; remaining: number } {
    const bal = emp.balances.find((b) => b.leaveTypeId === leaveTypeId);
    if (!bal) return { allocated: 0, used: 0, remaining: 0 };
    return { allocated: bal.allocated, used: bal.used, remaining: bal.allocated - bal.used };
  },

  // How much of the annual quota is earned by `at` under this leave type's accrual rule.
  accruedAllocated(type: LeaveTypeConfig, emp: Employee, at: Date = new Date()): number {
    const bal = emp.balances.find((b) => b.leaveTypeId === type.id);
    const allocated = bal?.allocated ?? type.defaultAnnualQuota;
    if (type.accrual === 'quarterly') {
      const q = quartersAccruedBy(at);
      return Math.round((allocated / 4) * q * 100) / 100;
    }
    return allocated;
  },

  getAccruedBalance(
    type: LeaveTypeConfig,
    emp: Employee,
    at: Date = new Date(),
  ): { accrued: number; used: number; remaining: number; allocated: number } {
    const bal = emp.balances.find((b) => b.leaveTypeId === type.id);
    const used = bal?.used ?? 0;
    const allocated = bal?.allocated ?? type.defaultAnnualQuota;
    const accrued = this.accruedAllocated(type, emp, at);
    return { accrued, used, remaining: accrued - used, allocated };
  },

  // Pending/approved overlap with a date range (exclusive of the same request if provided)
  overlapsExistingRequest(
    state: AppState,
    employeeId: string,
    startDate: string,
    endDate: string,
    excludeRequestId?: string,
  ): LeaveRequest | undefined {
    const start = parseISODate(startDate).getTime();
    const end = parseISODate(endDate).getTime();
    return state.leaveRequests.find((r) => {
      if (r.id === excludeRequestId) return false;
      if (r.employeeId !== employeeId) return false;
      if (r.status !== 'pending' && r.status !== 'approved') return false;
      const rs = parseISODate(r.startDate).getTime();
      const re = parseISODate(r.endDate).getTime();
      return rs <= end && re >= start;
    });
  },

  validate(
    state: AppState,
    input: LeaveApplicationInput,
    opts: { allowPastDates?: boolean } = {},
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (!input.leaveTypeId) issues.push({ field: 'leaveTypeId', message: 'Choose a leave type', severity: 'error' });
    if (!input.startDate) issues.push({ field: 'startDate', message: 'Start date is required', severity: 'error' });
    if (!input.endDate) issues.push({ field: 'endDate', message: 'End date is required', severity: 'error' });

    if (input.startDate && input.endDate) {
      if (parseISODate(input.endDate) < parseISODate(input.startDate)) {
        issues.push({ field: 'endDate', message: 'End date cannot be before start date', severity: 'error' });
      }
      if (!opts.allowPastDates && input.startDate < todayISO()) {
        issues.push({ field: 'startDate', message: 'Start date is in the past', severity: 'warning' });
      }
      if (input.halfDay && input.startDate !== input.endDate) {
        issues.push({ field: 'halfDay', message: 'Half day applies only to single-date requests', severity: 'error' });
      }
    }

    const emp = state.employees.find((e) => e.id === input.employeeId);
    const type = state.leaveTypes.find((t) => t.id === input.leaveTypeId);
    if (!emp) issues.push({ message: 'Unknown employee', severity: 'error' });
    if (!type) issues.push({ message: 'Unknown leave type', severity: 'error' });

    if (emp && type && input.startDate && input.endDate && parseISODate(input.endDate) >= parseISODate(input.startDate)) {
      const workingDays = computeWorkingDays(input.startDate, input.endDate, input.halfDay, {
        holidays: state.holidays,
        policy: state.policy,
      });
      if (workingDays === 0) {
        issues.push({
          field: 'window',
          message: 'Selected range has no working days (holidays/weekends only)',
          severity: 'error',
        });
      }
      if (input.halfDay && !type.allowHalfDay) {
        issues.push({ field: 'halfDay', message: `${type.name} does not allow half day`, severity: 'error' });
      }
      const accrued = this.getAccruedBalance(type, emp);
      const resulting = accrued.remaining - workingDays; // negative means over-draw
      if (resulting < 0) {
        const overBy = Math.abs(resulting);
        if (!type.allowNegativeBalance || overBy > type.maxNegativeBalance) {
          issues.push({
            field: 'balance',
            message: type.allowNegativeBalance
              ? `Requested ${workingDays} day(s) overshoots the ${type.maxNegativeBalance}-day negative cap (would end at ${resulting})`
              : `Requested ${workingDays} day(s) exceeds accrued balance of ${accrued.remaining} and this type doesn't permit negative balance`,
            severity: 'error',
          });
        } else {
          issues.push({
            field: 'balance',
            message: `Will leave you at ${resulting} day(s) — within the ${type.maxNegativeBalance}-day negative tolerance, but settles as Loss of Pay if still negative at end of Q4`,
            severity: 'warning',
          });
        }
      }
      const overlap = this.overlapsExistingRequest(state, emp.id, input.startDate, input.endDate);
      if (overlap) {
        issues.push({
          field: 'overlap',
          message: `Overlaps an existing ${overlap.status} request (${overlap.startDate} → ${overlap.endDate})`,
          severity: 'error',
        });
      }
    }

    return issues;
  },

  submit(state: AppState, input: LeaveApplicationInput): { state: AppState; request: LeaveRequest } {
    const workingDays = computeWorkingDays(input.startDate, input.endDate, input.halfDay, {
      holidays: state.holidays,
      policy: state.policy,
    });
    const req: LeaveRequest = {
      id: genId('lr'),
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
      halfDay: input.halfDay,
      workingDays,
      reason: input.reason.trim(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    const next: AppState = {
      ...state,
      leaveRequests: [req, ...state.leaveRequests],
      audit: [
        {
          id: genId('aud'),
          entityId: req.id,
          action: 'leave.submitted',
          actorId: input.employeeId,
          at: new Date().toISOString(),
        },
        ...state.audit,
      ],
    };
    return { state: next, request: req };
  },

  withdraw(state: AppState, requestId: string, actorId: string): AppState {
    const req = state.leaveRequests.find((r) => r.id === requestId);
    if (!req || req.status !== 'pending') return state;
    const updated: LeaveRequest = { ...req, status: 'withdrawn', decidedAt: new Date().toISOString() };
    return {
      ...state,
      leaveRequests: state.leaveRequests.map((r) => (r.id === requestId ? updated : r)),
      audit: [
        {
          id: genId('aud'),
          entityId: requestId,
          action: 'leave.withdrawn',
          actorId,
          at: new Date().toISOString(),
        },
        ...state.audit,
      ],
    };
  },

  cancelApproved(state: AppState, requestId: string, actorId: string, note?: string): AppState {
    const req = state.leaveRequests.find((r) => r.id === requestId);
    if (!req || req.status !== 'approved') return state;
    const employees = state.employees.map((e) => {
      if (e.id !== req.employeeId) return e;
      return {
        ...e,
        balances: e.balances.map((b) =>
          b.leaveTypeId === req.leaveTypeId
            ? { ...b, used: Math.max(0, b.used - req.workingDays) }
            : b,
        ),
      };
    });
    return {
      ...state,
      employees,
      leaveRequests: state.leaveRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'cancelled',
              decidedAt: new Date().toISOString(),
              decidedBy: actorId,
              reviewerComment: note,
            }
          : r,
      ),
      audit: [
        {
          id: genId('aud'),
          entityId: requestId,
          action: 'leave.cancelled',
          actorId,
          at: new Date().toISOString(),
          note,
        },
        ...state.audit,
      ],
    };
  },

  // Recalculate working days for all pending/approved requests when policy/holidays change.
  recalcAll(state: AppState): AppState {
    return {
      ...state,
      leaveRequests: state.leaveRequests.map((r) => ({
        ...r,
        workingDays:
          r.status === 'approved' || r.status === 'pending'
            ? computeWorkingDays(r.startDate, r.endDate, r.halfDay, {
                holidays: state.holidays,
                policy: state.policy,
              })
            : r.workingDays,
      })),
    };
  },
};

export function datesForLeaveRequest(req: LeaveRequest): string[] {
  return datesBetween(req.startDate, req.endDate).map(toISO);
}

export function leaveTypeById(types: LeaveTypeConfig[], id: string): LeaveTypeConfig | undefined {
  return types.find((t) => t.id === id);
}
