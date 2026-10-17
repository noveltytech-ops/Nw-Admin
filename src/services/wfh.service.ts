import type { Weekday, WFHRequest } from '@/types';
import { parseISODate } from '@/utils/date';
import { genId } from '@/utils/ids';
import type { AppState } from './storage.service';
import { isHoliday } from './working-days.service';

export interface WFHApplicationInput {
  employeeId: string;
  date: string;
  reason: string;
}

export interface WFHValidationIssue {
  field?: 'date' | 'reason' | 'conflict';
  message: string;
  severity: 'error' | 'warning';
}

export const wfhService = {
  validate(state: AppState, input: WFHApplicationInput): WFHValidationIssue[] {
    const issues: WFHValidationIssue[] = [];
    if (!input.date) {
      issues.push({ field: 'date', message: 'Pick a date', severity: 'error' });
      return issues;
    }

    const d = parseISODate(input.date);
    const dow = d.getDay() as Weekday;
    const mode = state.policy.workMode[dow];

    if (mode === 'off') {
      issues.push({ field: 'date', message: 'That day is a non-working day', severity: 'error' });
    }
    if (mode === 'wfh') {
      issues.push({
        field: 'date',
        message: 'This day is already a default WFH day — no request needed',
        severity: 'warning',
      });
    }
    if (isHoliday(input.date, state.holidays)) {
      issues.push({ field: 'date', message: 'That day is a company holiday', severity: 'error' });
    }

    const dup = state.wfhRequests.find(
      (r) =>
        r.employeeId === input.employeeId &&
        r.date === input.date &&
        (r.status === 'pending' || r.status === 'approved'),
    );
    if (dup) {
      issues.push({
        field: 'conflict',
        message: `An existing ${dup.status} WFH request exists for this date`,
        severity: 'error',
      });
    }

    // Conflict with approved leave
    const leaveConflict = state.leaveRequests.find(
      (r) =>
        r.employeeId === input.employeeId &&
        (r.status === 'approved' || r.status === 'pending') &&
        input.date >= r.startDate &&
        input.date <= r.endDate,
    );
    if (leaveConflict) {
      issues.push({
        field: 'conflict',
        message: `Overlaps a ${leaveConflict.status} leave request`,
        severity: 'error',
      });
    }
    return issues;
  },

  submit(state: AppState, input: WFHApplicationInput): { state: AppState; request: WFHRequest } {
    const req: WFHRequest = {
      id: genId('wfh'),
      employeeId: input.employeeId,
      date: input.date,
      reason: input.reason.trim(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    const next: AppState = {
      ...state,
      wfhRequests: [req, ...state.wfhRequests],
      audit: [
        {
          id: genId('aud'),
          entityId: req.id,
          action: 'wfh.submitted',
          actorId: input.employeeId,
          at: new Date().toISOString(),
        },
        ...state.audit,
      ],
    };
    return { state: next, request: req };
  },

  withdraw(state: AppState, requestId: string, actorId: string): AppState {
    const req = state.wfhRequests.find((r) => r.id === requestId);
    if (!req || req.status !== 'pending') return state;
    return {
      ...state,
      wfhRequests: state.wfhRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'withdrawn', decidedAt: new Date().toISOString() } : r,
      ),
      audit: [
        {
          id: genId('aud'),
          entityId: requestId,
          action: 'wfh.withdrawn',
          actorId,
          at: new Date().toISOString(),
        },
        ...state.audit,
      ],
    };
  },
};

export function resolveDailyWorkMode(
  state: AppState,
  employeeId: string,
  dateISO: string,
): 'office' | 'wfh' | 'off' | 'holiday' | 'leave' | 'wfh-exception' {
  if (isHoliday(dateISO, state.holidays)) return 'holiday';
  const d = parseISODate(dateISO);
  const dow = d.getDay() as Weekday;
  const policyMode = state.policy.workMode[dow];
  if (policyMode === 'off') return 'off';

  // Leave takes priority
  const onLeave = state.leaveRequests.find(
    (r) =>
      r.employeeId === employeeId &&
      r.status === 'approved' &&
      dateISO >= r.startDate &&
      dateISO <= r.endDate,
  );
  if (onLeave) return 'leave';

  // Approved WFH exception overrides office days
  const wfhException = state.wfhRequests.find(
    (r) => r.employeeId === employeeId && r.status === 'approved' && r.date === dateISO,
  );
  if (wfhException) return 'wfh-exception';

  return policyMode;
}
