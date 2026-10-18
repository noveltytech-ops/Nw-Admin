import { NextResponse } from 'next/server';
import { loadState, saveState } from '@/server/state';
import { leaveService, type LeaveApplicationInput } from '@/services/leave.service';
import { notifyLeaveSubmitted } from '@/server/email/notifications';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const input = (await req.json()) as LeaveApplicationInput;
  const current = await loadState();
  const { state: next, request } = leaveService.submit(current, input);
  await saveState(next);

  // Fire-and-forget email to the employee's manager. Awaited so Resend
  // errors show up in server logs, but any failure is swallowed inside
  // notifyLeaveSubmitted — the HTTP response never fails because of mail.
  await notifyLeaveSubmitted(next, request);

  return NextResponse.json(next);
}
