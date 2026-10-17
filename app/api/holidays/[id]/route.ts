import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import { holidayService } from '@/services/holiday.service';
import { leaveService } from '@/services/leave.service';
import type { Holiday } from '@/types';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actorId, patch } = (await req.json()) as { actorId: string; patch: Partial<Omit<Holiday, 'id'>> };
  const next = await withState((s) => leaveService.recalcAll(holidayService.update(s, actorId, id, patch)));
  return NextResponse.json(next);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actorId } = (await req.json()) as { actorId: string };
  const next = await withState((s) => leaveService.recalcAll(holidayService.remove(s, actorId, id)));
  return NextResponse.json(next);
}
