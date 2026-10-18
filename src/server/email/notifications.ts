import type { AppState } from '@/services/storage.service';
import type { LeaveRequest, WFHRequest } from '@/types';
import { employeeService } from '@/services/employee.service';
import { mailer } from './mailer';
import { leaveRequestTemplate, wfhRequestTemplate } from './templates';

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
  );
}

/**
 * Fire-and-forget notifier. Errors are logged, never re-thrown — mail failures
 * must never break the submit flow.
 */
export async function notifyLeaveSubmitted(state: AppState, request: LeaveRequest): Promise<void> {
  try {
    const employee = employeeService.byId(state, request.employeeId);
    if (!employee) return;
    if (!employee.managerId) {
      console.warn(`[notify] employee ${employee.id} has no manager, skipping leave notification`);
      return;
    }
    const manager = employeeService.byId(state, employee.managerId);
    if (!manager?.email) return;

    const leaveType = state.leaveTypes.find((t) => t.id === request.leaveTypeId);
    const { subject, html, text } = leaveRequestTemplate({
      employee,
      request,
      leaveType,
      appUrl: appUrl(),
    });

    await mailer.send({ to: manager.email, subject, html, text, replyTo: employee.email });
  } catch (err) {
    console.error('[notify] leave submitted failed:', err);
  }
}

export async function notifyWFHSubmitted(state: AppState, request: WFHRequest): Promise<void> {
  try {
    const employee = employeeService.byId(state, request.employeeId);
    if (!employee) return;
    if (!employee.managerId) {
      console.warn(`[notify] employee ${employee.id} has no manager, skipping WFH notification`);
      return;
    }
    const manager = employeeService.byId(state, employee.managerId);
    if (!manager?.email) return;

    const { subject, html, text } = wfhRequestTemplate({
      employee,
      request,
      appUrl: appUrl(),
    });

    await mailer.send({ to: manager.email, subject, html, text, replyTo: employee.email });
  } catch (err) {
    console.error('[notify] wfh submitted failed:', err);
  }
}
