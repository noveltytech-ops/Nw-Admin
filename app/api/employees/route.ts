import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import { adminEmployeeService } from '@/services/admin-employee.service';
import type { Employee } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { actorId, input } = (await req.json()) as { actorId: string; input: Omit<Employee, 'id' | 'balances'> };
  const next = await withState((s) => adminEmployeeService.create(s, actorId, input));
  return NextResponse.json(next);
}
