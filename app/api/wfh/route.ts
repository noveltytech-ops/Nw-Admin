import { NextResponse } from 'next/server';
import { loadState, saveState } from '@/server/state';
import { wfhService, type WFHApplicationInput } from '@/services/wfh.service';
import { notifyWFHSubmitted } from '@/server/email/notifications';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const input = (await req.json()) as WFHApplicationInput;
  const current = await loadState();
  const { state: next, request } = wfhService.submit(current, input);
  await saveState(next);

  await notifyWFHSubmitted(next, request);

  return NextResponse.json(next);
}
