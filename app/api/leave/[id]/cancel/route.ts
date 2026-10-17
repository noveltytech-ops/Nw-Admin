import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import { leaveService } from '@/services/leave.service';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actorId, note } = (await req.json()) as { actorId: string; note?: string };
  const next = await withState((s) => leaveService.cancelApproved(s, id, actorId, note));
  return NextResponse.json(next);
}
