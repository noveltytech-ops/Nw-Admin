import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import { leaveService } from '@/services/leave.service';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actorId } = (await req.json()) as { actorId: string };
  const next = await withState((s) => leaveService.withdraw(s, id, actorId));
  return NextResponse.json(next);
}
