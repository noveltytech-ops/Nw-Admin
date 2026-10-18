import type { Employee, LeaveRequest, LeaveTypeConfig, WFHRequest } from '@/types';

const fullName = (e: Employee) =>
  `${e.firstName}${e.lastName ? ` ${e.lastName}` : ''}`;

const dateRange = (start: string, end: string) =>
  start === end ? start : `${start} → ${end}`;

const base = (title: string, bodyHtml: string, ctaUrl: string, ctaLabel: string) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px 28px 24px;">
        <p style="margin:0 0 16px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">
          Novelty Wealth · People Portal
        </p>
        <h1 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#0f172a;">${title}</h1>
        ${bodyHtml}
        <div style="margin-top:28px;">
          <a href="${ctaUrl}"
             style="display:inline-block;background:#1e43d6;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500;">
            ${ctaLabel}
          </a>
        </div>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px;">
        FW Fintech Pvt Ltd · <a href="mailto:people@noveltywealth.in" style="color:#64748b;">people@noveltywealth.in</a>
      </p>
    </div>
  </body>
</html>`;

const row = (label: string, value: string) => `
<tr>
  <td style="padding:6px 0;color:#64748b;font-size:13px;width:140px;">${label}</td>
  <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${value}</td>
</tr>`;

export function leaveRequestTemplate(opts: {
  employee: Employee;
  request: LeaveRequest;
  leaveType: LeaveTypeConfig | undefined;
  appUrl: string;
}) {
  const { employee, request, leaveType, appUrl } = opts;
  const empName = fullName(employee);
  const dateStr = dateRange(request.startDate, request.endDate);
  const days = `${request.workingDays} day${request.workingDays === 1 ? '' : 's'}`;
  const halfDay = request.halfDay ? ` · ${request.halfDay} half` : '';
  const reasonBlock = request.reason
    ? `<div style="margin-top:16px;padding:12px 14px;background:#f1f5f9;border-radius:8px;font-size:14px;color:#334155;line-height:1.5;">
         <strong style="color:#0f172a;font-weight:600;">Reason:</strong> ${escapeHtml(request.reason)}
       </div>`
    : '';

  const body = `
    <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.5;">
      <strong>${empName}</strong> has submitted a leave request that needs your decision.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      ${row('Leave type', leaveType ? `${leaveType.name} (${leaveType.code})` : '—')}
      ${row('Dates', dateStr)}
      ${row('Working days', `${days}${halfDay}`)}
      ${row('Submitted', new Date(request.submittedAt).toLocaleString())}
      ${row('Email', employee.email)}
    </table>
    ${reasonBlock}
  `;

  return {
    subject: `Leave request from ${empName} (${days})`,
    html: base(`Leave request · ${empName}`, body, `${appUrl}/approvals`, 'Open Approval Inbox'),
    text:
      `${empName} submitted a leave request.\n\n` +
      `Type: ${leaveType?.name ?? '—'}\n` +
      `Dates: ${dateStr}\n` +
      `Working days: ${days}${halfDay}\n` +
      (request.reason ? `Reason: ${request.reason}\n` : '') +
      `\nReview: ${appUrl}/approvals`,
  };
}

export function wfhRequestTemplate(opts: {
  employee: Employee;
  request: WFHRequest;
  appUrl: string;
}) {
  const { employee, request, appUrl } = opts;
  const empName = fullName(employee);
  const reasonBlock = request.reason
    ? `<div style="margin-top:16px;padding:12px 14px;background:#f1f5f9;border-radius:8px;font-size:14px;color:#334155;line-height:1.5;">
         <strong style="color:#0f172a;font-weight:600;">Reason:</strong> ${escapeHtml(request.reason)}
       </div>`
    : '';

  const body = `
    <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.5;">
      <strong>${empName}</strong> has requested a WFH exception that needs your decision.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      ${row('Date', request.date)}
      ${row('Submitted', new Date(request.submittedAt).toLocaleString())}
      ${row('Email', employee.email)}
    </table>
    ${reasonBlock}
  `;

  return {
    subject: `WFH request from ${empName} (${request.date})`,
    html: base(`WFH request · ${empName}`, body, `${appUrl}/approvals`, 'Open Approval Inbox'),
    text:
      `${empName} requested WFH on ${request.date}.\n` +
      (request.reason ? `Reason: ${request.reason}\n` : '') +
      `\nReview: ${appUrl}/approvals`,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
