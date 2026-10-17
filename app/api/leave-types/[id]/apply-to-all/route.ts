import { NextResponse } from 'next/server';
import { withState } from '@/server/state';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { allocated } = (await req.json()) as { allocated: number };
  const next = await withState((s) => ({
    ...s,
    employees: s.employees.map((emp) => ({
      ...emp,
      balances: emp.balances.map((b) => (b.leaveTypeId === id ? { ...b, allocated } : b)),
    })),
  }));
  return NextResponse.json(next);
}
