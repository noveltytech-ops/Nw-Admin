import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import { leaveService, type LeaveApplicationInput } from '@/services/leave.service';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const input = (await req.json()) as LeaveApplicationInput;
  const next = await withState((s) => leaveService.submit(s, input));
  return NextResponse.json(next);
}
