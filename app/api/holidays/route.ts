import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import { holidayService } from '@/services/holiday.service';
import { leaveService } from '@/services/leave.service';
import type { Holiday } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { actorId, holiday } = (await req.json()) as { actorId: string; holiday: Omit<Holiday, 'id'> };
  const next = await withState((s) => leaveService.recalcAll(holidayService.add(s, actorId, holiday)));
  return NextResponse.json(next);
}
