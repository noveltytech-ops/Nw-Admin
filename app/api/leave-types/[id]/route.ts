import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import type { LeaveTypeConfig } from '@/types';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { patch } = (await req.json()) as { patch: Partial<LeaveTypeConfig> };
  const next = await withState((s) => ({
    ...s,
    leaveTypes: s.leaveTypes.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  }));
  return NextResponse.json(next);
}
