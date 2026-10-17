import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import type { LeavePolicy } from '@/types';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  const { patch } = (await req.json()) as { patch: Partial<LeavePolicy> };
  const next = await withState((s) => ({ ...s, leavePolicy: { ...s.leavePolicy, ...patch } }));
  return NextResponse.json(next);
}
