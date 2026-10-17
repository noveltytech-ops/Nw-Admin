import type { LeaveRequest, WFHRequest } from '@/types';
import { genId } from '@/utils/ids';
import type { AppState } from './storage.service';

export const approvalService = {
  canApproveLeave(state: AppState, approverId: string, request: LeaveRequest): boolean {
    const approver = state.employees.find((e) => e.id === approverId);
    if (!approver) return false;
    if (approver.role === 'admin') return true;
    const employee = state.employees.find((e) => e.id === request.employeeId);
    if (!employee) return false;
    return employee.managerId === approverId;
  },
  canApproveWFH(state: AppState, approverId: string, request: WFHRequest): boolean {
    const approver = state.employees.find((e) => e.id === approverId);
    if (!approver) return false;
    if (approver.role === 'admin') return true;
    const employee = state.employees.find((e) => e.id === request.employeeId);
    if (!employee) return false;
    return employee.managerId === approverId;
  },
  approveLeave(state: AppState, requestId: string, approverId: string, comment?: string): AppState {
    const req = state.leaveRequests.find((r) => r.id === requestId);
    if (!req || req.status !== 'pending') return state;
    if (!this.canApproveLeave(state, approverId, req)) return state;

    const employees = state.employees.map((e) => {
      if (e.id !== req.employeeId) return e;
      return {
        ...e,
        balances: e.balances.map((b) =>
          b.leaveTypeId === req.leaveTypeId ? { ...b, used: b.used + req.workingDays } : b,
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
              status: 'approved',
              decidedAt: new Date().toISOString(),
              decidedBy: approverId,
              reviewerComment: comment,
            }
          : r,
      ),
      audit: [
        {
          id: genId('aud'),
          entityId: requestId,
          action: 'leave.approved',
          actorId: approverId,
          at: new Date().toISOString(),
          note: comment,
        },
        ...state.audit,
      ],
    };
  },
  rejectLeave(state: AppState, requestId: string, approverId: string, comment?: string): AppState {
    const req = state.leaveRequests.find((r) => r.id === requestId);
    if (!req || req.status !== 'pending') return state;
    if (!this.canApproveLeave(state, approverId, req)) return state;
    return {
      ...state,
      leaveRequests: state.leaveRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              decidedAt: new Date().toISOString(),
              decidedBy: approverId,
              reviewerComment: comment,
            }
          : r,
      ),
      audit: [
        {
          id: genId('aud'),
          entityId: requestId,
          action: 'leave.rejected',
          actorId: approverId,
          at: new Date().toISOString(),
          note: comment,
        },
        ...state.audit,
      ],
    };
  },
  approveWFH(state: AppState, requestId: string, approverId: string, comment?: string): AppState {
    const req = state.wfhRequests.find((r) => r.id === requestId);
    if (!req || req.status !== 'pending') return state;
    if (!this.canApproveWFH(state, approverId, req)) return state;
    return {
      ...state,
      wfhRequests: state.wfhRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              decidedAt: new Date().toISOString(),
              decidedBy: approverId,
              reviewerComment: comment,
            }
          : r,
      ),
      audit: [
        {
          id: genId('aud'),
          entityId: requestId,
          action: 'wfh.approved',
          actorId: approverId,
          at: new Date().toISOString(),
          note: comment,
        },
        ...state.audit,
      ],
    };
  },
  rejectWFH(state: AppState, requestId: string, approverId: string, comment?: string): AppState {
    const req = state.wfhRequests.find((r) => r.id === requestId);
    if (!req || req.status !== 'pending') return state;
    if (!this.canApproveWFH(state, approverId, req)) return state;
    return {
      ...state,
      wfhRequests: state.wfhRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              decidedAt: new Date().toISOString(),
              decidedBy: approverId,
              reviewerComment: comment,
            }
          : r,
      ),
      audit: [
        {
          id: genId('aud'),
          entityId: requestId,
          action: 'wfh.rejected',
          actorId: approverId,
          at: new Date().toISOString(),
          note: comment,
        },
        ...state.audit,
      ],
    };
  },
};
