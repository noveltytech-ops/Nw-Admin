import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import { wfhService, type WFHApplicationInput } from '@/services/wfh.service';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const input = (await req.json()) as WFHApplicationInput;
  const next = await withState((s) => wfhService.submit(s, input));
  return NextResponse.json(next);
}
