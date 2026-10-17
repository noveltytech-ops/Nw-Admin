import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import { policyService } from '@/services/policy.service';
import type { WorkPolicy } from '@/types';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  const { actorId, patch } = (await req.json()) as { actorId: string; patch: Partial<WorkPolicy> };
  const next = await withState((s) => policyService.update(s, actorId, patch));
  return NextResponse.json(next);
}
