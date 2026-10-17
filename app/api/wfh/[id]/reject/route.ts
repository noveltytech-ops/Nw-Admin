import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import { approvalService } from '@/services/approval.service';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { approverId, comment } = (await req.json()) as { approverId: string; comment?: string };
  const next = await withState((s) => approvalService.rejectWFH(s, id, approverId, comment));
  return NextResponse.json(next);
}
