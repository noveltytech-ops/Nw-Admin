import { NextResponse } from 'next/server';
import { withState } from '@/server/state';
import { adminEmployeeService } from '@/services/admin-employee.service';
import type { Employee } from '@/types';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actorId, patch } = (await req.json()) as { actorId: string; patch: Partial<Omit<Employee, 'id'>> };
  const next = await withState((s) => adminEmployeeService.update(s, actorId, id, patch));
  return NextResponse.json(next);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actorId } = (await req.json()) as { actorId: string };
  const next = await withState((s) => adminEmployeeService.deactivate(s, actorId, id));
  return NextResponse.json(next);
}
