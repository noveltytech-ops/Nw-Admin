import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import { adminEmployeeService } from '@/services/admin-employee.service';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actorId, managerId } = (await req.json()) as { actorId: string; managerId: string | null };
  const next = await withState((s) => adminEmployeeService.setManager(s, actorId, id, managerId));
  return NextResponse.json(next);
}
